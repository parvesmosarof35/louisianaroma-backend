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
  const superAdminPass  = process.env.SUPER_ADMIN_PASS;

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
  console.log('Clearing database (non-user collections)...');
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.blendIngredient.deleteMany({});
  await prisma.customBlend.deleteMany({});
  await prisma.ingredient.deleteMany({});
  await prisma.product.deleteMany({});

  console.log('Seeding administrative and test users...');
  const adminPassword = await bcrypt.hash('LouisianaromaAdmin2026!', 10);
  const userPassword = await bcrypt.hash('LouisianaromaUser2026!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@louisianaroma.com' },
    update: { password: adminPassword, role: 'admin' },
    create: {
      email: 'admin@louisianaroma.com',
      name: 'Maison Louisianaroma',
      password: adminPassword,
      role: 'admin',
    },
  });

  const user = await prisma.user.upsert({
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

  console.log('Seeding standard luxury products for the Shop...');
  const products = [
    {
      name: "L'Ombre du Désert",
      category: 'Private Reserve',
      notes: 'Cambodian Oud, Frankincense, Damask Rose, Amber',
      price: 295.0,
      image: '/images/products/ombre-desert.jpg',
      description: 'An enigmatic journey into the heart of the desert, where warm oriental notes blend with rich, smoke-kissed oud.',
      isAvailable: true,
    },
    {
      name: 'Éphémère N°5',
      category: 'Les Ephemeres',
      notes: 'Florentine Iris, Violet Leaf, Sandalwood, White Musk',
      price: 220.0,
      image: '/images/products/ephemere-5.jpg',
      description: 'A fleeting moment of pure powdery iris, grounded in creamy Mysore sandalwood and soft, enveloping white musk.',
      isAvailable: true,
    },
    {
      name: 'Nectar Sauvage',
      category: 'Elixir de Parfum',
      notes: 'Calabrian Bergamot, Jasmine Sambac, Honey, Patchouli',
      price: 340.0,
      image: '/images/products/nectar-sauvage.jpg',
      description: 'A wild, intoxicating blend of golden honey and nocturnal jasmine, energized with a burst of zesty bergamot.',
      isAvailable: true,
    },
    {
      name: 'Le Crépuscule',
      category: 'Private Reserve',
      notes: 'Saffron, Cardamom, Leather, Tonka Bean',
      price: 310.0,
      image: '/images/products/crepuscule.jpg',
      description: 'The warmth of a golden hour captured in precious spices, rich leather, and sweet tonka bean.',
      isAvailable: true,
    },
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
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
