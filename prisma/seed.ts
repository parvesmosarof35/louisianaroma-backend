import { PrismaClient, NoteType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

// Zero-dependency .env loader (avoids requiring the dotenv package)
(function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
})();

const prisma = new PrismaClient();

async function main() {
  // ─── Super Admin (upsert — safe to re-run) ──────────────────────────────
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPass = process.env.SUPER_ADMIN_PASS;

  if (!superAdminEmail || !superAdminPass) {
    throw new Error(
      'SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASS must be set in .env',
    );
  }

  const superAdminHash = await bcrypt.hash(superAdminPass, 12);

  await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      password: superAdminHash,
      role: 'superadmin',
      isVerify: true,
      status: 'active',
    },
    create: {
      email: superAdminEmail,
      name: 'Super Admin',
      password: superAdminHash,
      role: 'superadmin',
      isVerify: true,
      status: 'active',
    },
  });

  console.log(`✅ Super admin upserted: ${superAdminEmail}`);

  // ─── Clear remaining data ────────────────────────────────────────────────
  console.log('Clearing database...');
  await prisma.review.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.blendIngredient.deleteMany({});
  await prisma.customBlend.deleteMany({});
  await prisma.ingredient.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.collection.deleteMany({});

  console.log('Seeding administrative and test users...');
  const adminPassword = await bcrypt.hash('LouisianaromaAdmin2026!', 10);
  const userPassword = await bcrypt.hash('LouisianaromaUser2026!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@louisianaroma.com' },
    update: { password: adminPassword, role: 'admin' },
    create: {
      email: 'admin@louisianaroma.com',
      name: 'Louisianaroma',
      password: adminPassword,
      role: 'admin',
    },
  });

  await prisma.user.upsert({
    where: { email: 'customer@louisianaroma.com' },
    update: { password: userPassword, role: 'user' },
    create: {
      email: 'customer@louisianaroma.com',
      name: 'Jean-Luc Godard',
      password: userPassword,
      role: 'user',
    },
  });

  console.log('Seeding bespoke ingredients for the Atelier...');
  const ingredients = [
    // Top Notes
    {
      name: 'Calabrian Bergamot',
      category: 'Citrus Elixir',
      type: NoteType.TOP_NOTE,
      description: 'Zesty, bright, and slightly spicy with a refined sun-drenched sophistication.',
      image: '/images/ingredients/bergamot.jpg',
      stock: 1500,
    },
    {
      name: 'Sichuan Pepper',
      category: 'Spicy Fusion',
      type: NoteType.TOP_NOTE,
      description: 'Vibrant, electric, with a fresh tingling warmth that wakes up the senses.',
      image: '/images/ingredients/pepper.jpg',
      stock: 1200,
    },
    {
      name: 'Sicilian Lemon',
      category: 'Citrus Elixir',
      type: NoteType.TOP_NOTE,
      description: 'Crisp, solar, sparkling citrus that brings a clean radiance.',
      image: '/images/ingredients/lemon.jpg',
      stock: 2000,
    },
    // Heart Notes
    {
      name: 'Damask Rose',
      category: 'Floral Absolute',
      type: NoteType.HEART_NOTE,
      description: 'Rich, honeyed, velvety floral absolute harvested at dawn in Bulgaria.',
      image: '/images/ingredients/rose.jpg',
      stock: 800,
    },
    {
      name: 'Florentine Iris',
      category: 'Powdery Elegance',
      type: NoteType.HEART_NOTE,
      description: 'Noble, powdery, woody-floral; one of the most precious raw materials in perfumery.',
      image: '/images/ingredients/iris.jpg',
      stock: 500,
    },
    {
      name: 'Jasmine Sambac',
      category: 'Floral Absolute',
      type: NoteType.HEART_NOTE,
      description: 'Intense, opulent floral note with green facets and warm, animalic undertones.',
      image: '/images/ingredients/jasmine.jpg',
      stock: 900,
    },
    // Base Notes
    {
      name: 'Cambodian Oud',
      category: 'Sacred Woods',
      type: NoteType.BASE_NOTE,
      description: 'Deep, mysterious, animalic and sweet woody resin of infinite complexity.',
      image: '/images/ingredients/oud.jpg',
      stock: 300,
    },
    {
      name: 'Bourbon Vanilla',
      category: 'Gourmand Absolute',
      type: NoteType.BASE_NOTE,
      description: 'Warm, dark, balsamic sweetness that wraps the fragrance in a luxurious embrace.',
      image: '/images/ingredients/vanilla.jpg',
      stock: 1000,
    },
    {
      name: 'Ambergris',
      category: 'Oceanic Nectar',
      type: NoteType.BASE_NOTE,
      description: 'Salty, warm, marine-mineral compound that radiates warmth and extends dry-down longevity.',
      image: '/images/ingredients/ambergris.jpg',
      stock: 400,
    },
  ];

  for (const ingredient of ingredients) {
    await prisma.ingredient.create({ data: ingredient });
  }

  console.log('Seeding standard luxury collections...');
  const privateReserveCollection = await prisma.collection.create({
    data: {
      name: 'Private Reserve',
      image: '/images/collections/private-reserve.jpg',
      numberOfProducts: 0,
    },
  });

  const lesEphemeresCollection = await prisma.collection.create({
    data: {
      name: 'Les Ephemeres',
      image: '/images/collections/les-ephemeres.jpg',
      numberOfProducts: 0,
    },
  });

  const elixirDeParfumCollection = await prisma.collection.create({
    data: {
      name: 'Elixir de Parfum',
      image: '/images/collections/elixir-de-parfum.jpg',
      numberOfProducts: 0,
    },
  });

  console.log('Seeding standard luxury products for the Shop...');
  const productsData = [
    {
      label: 'Private Reserve',
      name: "L'Ombre du Désert",
      collectionName: 'Private Reserve',
      price: 295.0,
      images: [
        { image: '/images/products/ombre-desert.jpg', position: 0 }
      ],
      sizes: ['50ml', '100ml'],
      tags: ['Oud', 'Frankincense', 'Rose', 'Amber', 'Woody', 'Oriental'],
      description: 'An enigmatic journey into the heart of the desert, where warm oriental notes blend with rich, smoke-kissed oud.',
      isAvailable: true,
      hasfreedelivery: true,
      isfeatured: true,
      faqs: [
        { question: 'Is this fragrance suitable for evening wear?', answer: 'Yes, its rich blend of oud and amber makes it perfect for sophisticated evenings.' }
      ],
      sectiontwo: {
        show: true,
        title: 'Anatomy of L\'Ombre du Désert',
        description: 'A deep look at the ingredients of this desert masterpiece.',
        cards: [
          { image: '/images/ingredients/oud.jpg', slogan: 'Sacred Woods', title: 'Cambodian Oud', description: 'Deep, mysterious, and warm resin.' }
        ]
      }
    },
    {
      label: 'Les Ephemeres',
      name: 'Éphémère N°5',
      collectionName: 'Les Ephemeres',
      price: 220.0,
      images: [
        { image: '/images/products/ephemere-5.jpg', position: 0 }
      ],
      sizes: ['50ml', '100ml'],
      tags: ['Iris', 'Violet', 'Sandalwood', 'Musk', 'Powdery', 'Floral'],
      description: 'A fleeting moment of pure powdery iris, grounded in creamy Mysore sandalwood and soft, enveloping white musk.',
      isAvailable: true,
      hasfreedelivery: false,
      isfeatured: false,
      faqs: [
        { question: 'Does this scent have high longevity?', answer: 'Yes, the white musk and sandalwood base provides a long-lasting gentle skin scent.' }
      ],
      sectiontwo: {
        show: true,
        title: 'Anatomy of Éphémère N°5',
        description: 'A botanical exploration of powdery iris and creamy woods.',
        cards: [
          { image: '/images/ingredients/iris.jpg', slogan: 'Powdery Elegance', title: 'Florentine Iris', description: 'Noble, powdery, and soft floral.' }
        ]
      }
    },
    {
      label: 'Elixir de Parfum',
      name: 'Nectar Sauvage',
      collectionName: 'Elixir de Parfum',
      price: 340.0,
      images: [
        { image: '/images/products/nectar-sauvage.jpg', position: 0 }
      ],
      sizes: ['50ml', '100ml'],
      tags: ['Bergamot', 'Jasmine', 'Honey', 'Patchouli', 'Citrus', 'Sweet'],
      description: 'A wild, intoxicating blend of golden honey and nocturnal jasmine, energized with a burst of zesty bergamot.',
      isAvailable: true,
      hasfreedelivery: true,
      isfeatured: true,
      faqs: [
        { question: 'Is this a sweet fragrance?', answer: 'It is a rich honeyed floral balanced beautifully with vibrant citrus bergamot.' }
      ],
      sectiontwo: {
        show: true,
        title: 'Anatomy of Nectar Sauvage',
        description: 'An exploration of honeyed florals and sparkling citrus.',
        cards: [
          { image: '/images/ingredients/jasmine.jpg', slogan: 'Floral Absolute', title: 'Jasmine Sambac', description: 'Opulent jasmine absolute harvested at dawn.' }
        ]
      }
    },
    {
      label: 'Private Reserve',
      name: 'Le Crépuscule',
      collectionName: 'Private Reserve',
      price: 310.0,
      images: [
        { image: '/images/products/crepuscule.jpg', position: 0 }
      ],
      sizes: ['50ml', '100ml'],
      tags: ['Saffron', 'Cardamom', 'Leather', 'Tonka', 'Spicy', 'Warm'],
      description: 'The warmth of a golden hour captured in precious spices, rich leather, and sweet tonka bean.',
      isAvailable: true,
      hasfreedelivery: true,
      isfeatured: false,
      faqs: [
        { question: 'What are the main base notes?', answer: 'Rich leather and sweet warm tonka bean constitute the lingering base.' }
      ],
      sectiontwo: {
        show: true,
        title: 'Anatomy of Le Crépuscule',
        description: 'A sunset-hued study of fine leather and exotic spices.',
        cards: [
          { image: '/images/ingredients/vanilla.jpg', slogan: 'Warm Balsamic', title: 'Bourbon Vanilla', description: 'Dark, warm vanilla to enrich spices.' }
        ]
      }
    },
  ];

  for (const item of productsData) {
    let categoryId = '';
    if (item.collectionName === 'Private Reserve') {
      categoryId = privateReserveCollection.id;
    } else if (item.collectionName === 'Les Ephemeres') {
      categoryId = lesEphemeresCollection.id;
    } else {
      categoryId = elixirDeParfumCollection.id;
    }

    const { collectionName, ...data } = item;

    await prisma.product.create({
      data: {
        ...data,
        category: categoryId,
      },
    });

    // Increment numberOfProducts for that collection
    await prisma.collection.update({
      where: { id: categoryId },
      data: { numberOfProducts: { increment: 1 } },
    });
  }

  // ─── Seed Essence Mediums ──────────────────────────────────────────
  console.log('Seeding essence mediums...');
  const mediums = [
    { name: 'Fragrance', image: '/images/mediums/fragrance.jpg', price: 0.00 },
    { name: 'Essence Oil', image: '/images/mediums/essence-oil.jpg', price: 15.00 },
    { name: 'Artisanal Soap', image: '/images/mediums/artisanal-soap.jpg', price: 10.00 },
    { name: 'Shower Gel', image: '/images/mediums/shower-gel.jpg', price: 12.00 },
  ];
  for (const medium of mediums) {
    const existing = await prisma.essencemedium.findFirst({
      where: { name: medium.name },
    });
    if (!existing) {
      await prisma.essencemedium.create({
        data: medium,
      });
    }
  }

  // ─── Seed Sizing Pricing ───────────────────────────────────────────
  console.log('Seeding size pricing tables...');
  const sizes = [
    { size: '30ml', label: '30mL', price: 25.00 },
    { size: '50ml', label: '50mL', price: 45.00 },
    { size: '100ml', label: '100mL', price: 70.00 },
  ];
  for (const s of sizes) {
    await prisma.sizePricing.upsert({
      where: { size: s.size },
      update: { price: s.price },
      create: s,
    });
  }

  // ─── Seed Concentration Levels ──────────────────────────────────────
  console.log('Seeding concentration markups...');
  const concentrations = [
    { percentage: '20%', name: 'EDP', additionalPrice: 0.00 },
    { percentage: '30%', name: 'Extrait', additionalPrice: 10.00 },
    { percentage: '40%', name: 'Parfum', additionalPrice: 20.00 },
  ];
  for (const c of concentrations) {
    await prisma.concentrationLevel.upsert({
      where: { percentage: c.percentage },
      update: { additionalPrice: c.additionalPrice },
      create: c,
    });
  }

  // ─── Seed Delivery Price ──────────────────────────────────────────
  console.log('Seeding delivery price...');
  const dpCount = await prisma.delivaryPrice.count();
  if (dpCount === 0) {
    await prisma.delivaryPrice.create({
      data: {
        insideusa: 20,
        outsideusa: 30,
      },
    });
  }

  console.log('Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
