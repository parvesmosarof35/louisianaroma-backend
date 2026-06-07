import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CustomBlendsService } from '../custom-blends/custom-blends.service';
import { CreateOrderDto } from './orders.dto';
import Stripe from 'stripe';
import config from '../config';

@Injectable()
export class OrdersService {
  private stripe: any;

  constructor(
    private prisma: PrismaService,
    private customBlendsService: CustomBlendsService,
  ) {
    this.stripe = new Stripe(config.STRIPE_SECRET_KEY || '');
  }

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
                    const ingredientIds = item.newCustomBlend.ingredients.map((i) => i.ingredientId);
          const existingIngredients = await tx.ingredient.findMany({
            where: { id: { in: ingredientIds } },
          });
          const existingFormulas = await tx.formula.findMany({
            where: { id: { in: ingredientIds } },
          });

          const totalFound = existingIngredients.length + existingFormulas.length;

          if (totalFound !== ingredientIds.length) {
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

          const allIngs = await tx.ingredient.findMany();
          const fallbackIngredient = allIngs[0] || null;

          const mappedIngredients = await Promise.all(
            item.newCustomBlend.ingredients.map(async (ing) => {
              let ingredient = allIngs.find((i) => i.id === ing.ingredientId) || null;

              if (!ingredient) {
                const formula = await tx.formula.findUnique({
                  where: { id: ing.ingredientId },
                });
                if (formula) {
                  const formulaNameLower = formula.name.toLowerCase();
                  ingredient = allIngs.find((i) => {
                    const ingNameLower = i.name.toLowerCase();
                    if (formulaNameLower.includes(ingNameLower) || ingNameLower.includes(formulaNameLower)) {
                      return true;
                    }
                    const keywords = ["bergamot", "pepper", "lemon", "rose", "iris", "jasmine", "oud", "vanilla", "ambergris", "amber", "sandalwood", "citrus"];
                    for (const word of keywords) {
                      if (formulaNameLower.includes(word) && ingNameLower.includes(word)) {
                        return true;
                      }
                    }
                    return false;
                  }) || null;
                }
              }

              // Fallback to first available ingredient if mapping failed completely
              if (!ingredient) {
                ingredient = fallbackIngredient;
              }

              return {
                ingredientId: ingredient ? ingredient.id : ing.ingredientId,
                percentage: ing.percentage,
              };
            })
          );

          await tx.blendIngredient.createMany({
            data: mappedIngredients.map((ing) => ({
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

          // Queue stock deductions using mappedIngredientIds
          for (const mappedIng of mappedIngredients) {
            stockUpdates.push({
              ingredientId: mappedIng.ingredientId,
              amountToDeduct: mappedIng.percentage * item.quantity,
            });
          }
        }
      }

      // 2. Perform Stock Deductions & Verify Inventories
      for (const update of stockUpdates) {
        let ingredient = await tx.ingredient.findUnique({
          where: { id: update.ingredientId },
        });

        // Try mapping from Formula if not found directly
        if (!ingredient) {
          const formula = await tx.formula.findUnique({
            where: { id: update.ingredientId },
          });
          if (formula) {
            const formulaNameLower = formula.name.toLowerCase();
            const allIngs = await tx.ingredient.findMany();
            ingredient = allIngs.find((ing) => {
              const ingNameLower = ing.name.toLowerCase();
              if (formulaNameLower.includes(ingNameLower) || ingNameLower.includes(formulaNameLower)) {
                return true;
              }
              const keywords = ["bergamot", "pepper", "lemon", "rose", "iris", "jasmine", "oud", "vanilla", "ambergris", "amber", "sandalwood", "citrus"];
              for (const word of keywords) {
                if (formulaNameLower.includes(word) && ingNameLower.includes(word)) {
                  return true;
                }
              }
              return false;
            }) || null;
          }
        }

        if (ingredient) {
          if (ingredient.stock < update.amountToDeduct) {
            throw new BadRequestException(
              `Incongruent reserves: The ingredient '${ingredient.name}' has insufficient stock (${ingredient.stock}ml left, need ${update.amountToDeduct}ml).`,
            );
          }

          // Deduct stock
          await tx.ingredient.update({
            where: { id: ingredient.id },
            data: {
              stock: {
                decrement: update.amountToDeduct,
              },
            },
          });
        }
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
    }, {
      timeout: 20000,
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

  async createStripeCheckoutSession(order: any, origin: string): Promise<string> {
    const lineItems = order.items.map((item: any) => {
      let name = 'Luxury Fragrance';
      if (item.product) {
        name = item.product.name;
      } else if (item.customBlend) {
        name = item.customBlend.name || 'Bespoke Custom Blend';
      }

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name,
            description: item.product?.description || undefined,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      };
    });

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      allow_promotion_codes: true,
      success_url: `${origin}/dashboard/userdashboard/orders?success=true&order_id=${order.id}`,
      cancel_url: `${origin}/checkout?cancelled=true`,
      metadata: {
        orderId: order.id,
      },
    });

    return session.url || '';
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string): Promise<void> {
    let event: any;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        config.STRIPE_WEBHOOK_SECRET || '',
      );
    } catch (err: any) {
      console.error(`[Webhook Signature Verification Failed] ${err.message}`);
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }

    console.log(`[Stripe Webhook Received] Event Type: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const orderId = session.metadata?.orderId;
        if (orderId) {
          const amountPaid = session.amount_total ? session.amount_total / 100 : 0;
          const paymentId = session.payment_intent as string || session.id;

          await this.prisma.order.update({
            where: { id: orderId },
            data: {
              status: 'PROCESSING',
              paymentId,
              totalAmount: amountPaid > 0 ? amountPaid : undefined,
            },
          });
          console.log(`[Order Confirmed] Order ${orderId} status set to PROCESSING. Paid: $${amountPaid}`);
        }
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object as any;
        const orderId = session.metadata?.orderId;
        if (orderId) {
          await this.cancelOrderAndRestoreStock(orderId);
          console.log(`[Order Cancelled - Session Expired] Order ${orderId} inventory restored.`);
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as any;
        const order = await this.prisma.order.findFirst({
          where: { paymentId: paymentIntent.id },
        });
        if (order) {
          await this.cancelOrderAndRestoreStock(order.id);
          console.log(`[Order Cancelled - Payment Failed] Order ${order.id} inventory restored.`);
        }
        break;
      }
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  }

  async cancelOrderAndRestoreStock(orderId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              customBlend: {
                include: {
                  ingredients: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found.`);
      }

      if (order.status === 'CANCELLED') {
        return; // Already cancelled
      }

      // 1. Update order status to CANCELLED
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });

      // 2. Restore ingredient stocks
      for (const item of order.items) {
        if (item.customBlend) {
          for (const blendIng of item.customBlend.ingredients) {
            const amountToRestore = blendIng.percentage * item.quantity;
            await tx.ingredient.update({
              where: { id: blendIng.ingredientId },
              data: {
                stock: {
                  increment: amountToRestore,
                },
              },
            });
            console.log(`[Stock Restored] Ingredient ${blendIng.ingredientId}: +${amountToRestore}ml`);
          }
        }
      }
    });
  }
}
