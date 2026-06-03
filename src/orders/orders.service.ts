import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CustomBlendsService } from '../custom-blends/custom-blends.service';
import { CreateOrderDto } from './orders.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private customBlendsService: CustomBlendsService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsData: any[] = [];
      const stockUpdates: { ingredientId: string; amountToDeduct: number }[] = [];

      // 1. Resolve and calculate prices for all checkout items
      for (const item of dto.items) {
        if (item.productId) {
          // Standard Product
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product || !product.isAvailable) {
            throw new BadRequestException(`Standard formulation '${product?.name || item.productId}' is currently unavailable.`);
          }

          const price = product.price;
          const subtotal = price * item.quantity;
          totalAmount += subtotal;

          orderItemsData.push({
            productId: item.productId,
            quantity: item.quantity,
            price,
          });
        } else if (item.customBlendId) {
          // Existing Custom Blend
          const blend = await tx.customBlend.findUnique({
            where: { id: item.customBlendId },
            include: { ingredients: true },
          });

          if (!blend) {
            throw new NotFoundException(`Olfactory formulation signature '${item.customBlendId}' was not found.`);
          }

          const price = blend.price;
          const subtotal = price * item.quantity;
          totalAmount += subtotal;

          orderItemsData.push({
            customBlendId: item.customBlendId,
            quantity: item.quantity,
            price,
          });

          // Queue stock deductions (1 bottle = 100ml volume; percentage translates directly to ml)
          for (const blendIng of blend.ingredients) {
            stockUpdates.push({
              ingredientId: blendIng.ingredientId,
              amountToDeduct: blendIng.percentage * item.quantity,
            });
          }
        } else if (item.newCustomBlend) {
          // Dynamic New Custom Blend - Save configuration first
          // We call customBlendsService logic manually within this transaction to keep it ACID-compliant
          const ingredientIds = item.newCustomBlend.ingredients.map((i) => i.ingredientId);
          const existingIngredients = await tx.ingredient.findMany({
            where: { id: { in: ingredientIds } },
          });

          if (existingIngredients.length !== ingredientIds.length) {
            throw new BadRequestException('One or more selected raw materials for the new custom blend are not available.');
          }

          const targetSize = item.newCustomBlend.bottleSize || '100ml';
          const targetConcentration = item.newCustomBlend.concentration || '20%';

          // Calculate price dynamically based on size & concentration configured
          const sizeConfig = await tx.sizePricing.findUnique({
            where: { size: targetSize },
          });
          if (!sizeConfig) {
            throw new BadRequestException(`Selected bottle size '${targetSize}' configuration does not exist.`);
          }

          const concConfig = await tx.concentrationLevel.findUnique({
            where: { percentage: targetConcentration },
          });
          if (!concConfig) {
            throw new BadRequestException(`Selected concentration level '${targetConcentration}' configuration does not exist.`);
          }

          const mediumConfig = await tx.essencemedium.findUnique({
            where: { id: item.newCustomBlend.mediumId },
          });
          if (!mediumConfig) {
            throw new BadRequestException(`Selected essence medium signature '${item.newCustomBlend.mediumId}' does not exist.`);
          }

          const finalPrice = sizeConfig.price + concConfig.additionalPrice;

          const newBlend = await tx.customBlend.create({
            data: {
              userId,
              name: item.newCustomBlend.name,
              price: finalPrice,
              bottleSize: targetSize,
              concentration: targetConcentration,
              mediumId: item.newCustomBlend.mediumId,
              labelBg: item.newCustomBlend.labelBg,
              textColor: item.newCustomBlend.textColor,
              textAlign: item.newCustomBlend.textAlign,
              labelFontSize: item.newCustomBlend.labelFontSize,
              productType: item.newCustomBlend.productType || 'Fragrance',
            },
          });

          await tx.blendIngredient.createMany({
            data: item.newCustomBlend.ingredients.map((ing) => ({
              blendId: newBlend.id,
              ingredientId: ing.ingredientId,
              percentage: ing.percentage,
            })),
          });

          const price = newBlend.price;
          const subtotal = price * item.quantity;
          totalAmount += subtotal;

          orderItemsData.push({
            customBlendId: newBlend.id,
            quantity: item.quantity,
            price,
          });

          // Queue stock deductions
          for (const newIng of item.newCustomBlend.ingredients) {
            stockUpdates.push({
              ingredientId: newIng.ingredientId,
              amountToDeduct: newIng.percentage * item.quantity,
            });
          }
        }
      }

      // 2. Perform Stock Deductions & Verify Inventories
      for (const update of stockUpdates) {
        const ingredient = await tx.ingredient.findUnique({
          where: { id: update.ingredientId },
        });

        if (!ingredient || ingredient.stock < update.amountToDeduct) {
          throw new BadRequestException(
            `Incongruent reserves: The ingredient '${ingredient?.name || update.ingredientId}' has insufficient stock (${ingredient?.stock || 0}ml left, need ${update.amountToDeduct}ml).`,
          );
        }

        // Deduct stock
        await tx.ingredient.update({
          where: { id: update.ingredientId },
          data: {
            stock: {
              decrement: update.amountToDeduct,
            },
          },
        });
      }

      // 3. Create the Main Order
      const order = await tx.order.create({
        data: {
          userId,
          totalAmount,
          shippingAddress: dto.shippingAddress,
          paymentId: dto.paymentId || `mock_stripe_${Math.random().toString(36).substring(7)}`,
          status: 'PENDING',
        },
      });

      // 4. Link OrderItems to Order
      for (const itemData of orderItemsData) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            ...itemData,
          },
        });
      }

      // Return complete order details
      return tx.order.findUnique({
        where: { id: order.id },
        include: {
          items: {
            include: {
              product: true,
              customBlend: {
                include: {
                  ingredients: {
                    include: {
                      ingredient: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });
  }

  async getMyOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
            customBlend: {
              include: {
                ingredients: {
                  include: {
                    ingredient: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      meta: { count: orders.length },
      data: orders,
    };
  }

  async getOrderDetails(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
            customBlend: {
              include: {
                ingredients: {
                  include: {
                    ingredient: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('The ordered collection requested is not cataloged.');
    }

    if (order.userId !== userId) {
      throw new BadRequestException('This ordered portfolio is linked to another luxury credentials profile.');
    }

    return {
      success: true,
      data: order,
    };
  }

  async getAdminOrderDetails(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            customBlend: {
              include: {
                medium: true,
                ingredients: {
                  include: {
                    ingredient: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('The ordered collection requested is not cataloged.');
    }

    return {
      success: true,
      data: order,
    };
  }

  async getAllOrders(status?: OrderStatus, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const take = limit;

    const whereCondition: any = {};
    if (status) {
      whereCondition.status = status;
    }

    const total = await this.prisma.order.count({ where: whereCondition });
    const orders = await this.prisma.order.findMany({
      where: whereCondition,
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            fullname: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
            customBlend: {
              include: {
                ingredients: {
                  include: {
                    ingredient: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      meta: {
        page,
        limit,
        total,
      },
      data: orders,
    };
  }

  async updateOrderStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`The order with ID '${id}' was not found.`);
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            product: true,
            customBlend: {
              include: {
                ingredients: {
                  include: {
                    ingredient: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      message: 'Order status updated successfully.',
      data: updatedOrder,
    };
  }
}
