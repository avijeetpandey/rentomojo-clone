// Full catalog seed — admin/demo users, all categories, and products for every city.
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CITIES = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai'];

const CATEGORIES = [
  { slug: 'furniture', name: 'Furniture', description: 'Beds, sofas, tables, chairs', iconName: 'Sofa' },
  {
    slug: 'appliances',
    name: 'Appliances',
    description: 'Fridges, washing machines, ACs',
    iconName: 'WashingMachine',
  },
  { slug: 'electronics', name: 'Electronics', description: 'TVs, laptops, gaming', iconName: 'Tv' },
  {
    slug: 'packages',
    name: 'Packages',
    description: 'Bundled rooms & full home kits',
    iconName: 'PackageOpen',
  },
];

const PRODUCTS = [
  {
    slug: 'kingsley-queen-bed',
    name: 'Kingsley Queen Bed',
    category: 'furniture',
    baseMonthlyRent: 1499,
    depositAmount: 3000,
    imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600',
    description: 'Solid wood queen-sized bed with hydraulic storage and a quilted headboard.',
  },
  {
    slug: 'aspen-3-seater-sofa',
    name: 'Aspen 3-Seater Sofa',
    category: 'furniture',
    baseMonthlyRent: 1299,
    depositAmount: 2500,
    imageUrl: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600',
    description: 'Plush three-seater sofa upholstered in stain-resistant fabric.',
  },
  {
    slug: 'maple-dining-set-4',
    name: 'Maple 4-Seater Dining Set',
    category: 'furniture',
    baseMonthlyRent: 999,
    depositAmount: 2000,
    imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600',
    description: 'Compact 4-seater dining set ideal for apartments.',
  },
  {
    slug: 'study-desk-flex',
    name: 'Flex Study Desk + Chair',
    category: 'furniture',
    baseMonthlyRent: 599,
    depositAmount: 1200,
    imageUrl: 'https://images.unsplash.com/photo-1518733057094-95b53143d2a7?w=600',
    description: 'Ergonomic study desk with cable management and a mesh chair.',
  },
  {
    slug: 'frost-300l-fridge',
    name: 'Frost 300L Double-Door Refrigerator',
    category: 'appliances',
    baseMonthlyRent: 899,
    depositAmount: 2500,
    imageUrl: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600',
    description: 'Energy-efficient 300L frost-free fridge with smart inverter.',
  },
  {
    slug: 'turbowash-7kg',
    name: 'TurboWash 7kg Front-Load Washer',
    category: 'appliances',
    baseMonthlyRent: 799,
    depositAmount: 2200,
    imageUrl: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=600',
    description: 'Fully automatic front-load washing machine with steam wash.',
  },
  {
    slug: 'coolair-15ton-ac',
    name: 'CoolAir 1.5 Ton Split AC',
    category: 'appliances',
    baseMonthlyRent: 1199,
    depositAmount: 3000,
    imageUrl: 'https://images.unsplash.com/photo-1631545806609-21f10cd0e2a6?w=600',
    description: '5-star inverter split AC with PM 2.5 filter.',
  },
  {
    slug: 'vista-43-smarttv',
    name: 'Vista 43" 4K Smart TV',
    category: 'electronics',
    baseMonthlyRent: 699,
    depositAmount: 2000,
    imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600',
    description: '43-inch 4K HDR smart TV with built-in streaming apps.',
  },
  {
    slug: 'pulse-gaming-laptop',
    name: 'Pulse 15" Gaming Laptop',
    category: 'electronics',
    baseMonthlyRent: 2499,
    depositAmount: 6000,
    imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600',
    description: 'Ryzen 7 / RTX gaming laptop with 144Hz display.',
  },
  {
    slug: 'home-essentials-1bhk',
    name: '1BHK Home Essentials Package',
    category: 'packages',
    baseMonthlyRent: 3499,
    depositAmount: 8000,
    imageUrl: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600',
    description: 'Bed + sofa + dining + fridge + washing machine bundled at one rent.',
  },
  {
    slug: 'studio-starter-pack',
    name: 'Studio Starter Pack',
    category: 'packages',
    baseMonthlyRent: 1999,
    depositAmount: 5000,
    imageUrl: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=600',
    description: 'Bed, study desk, mini-fridge and TV — perfect for a studio.',
  },
  {
    slug: 'work-from-home-kit',
    name: 'Work-from-Home Kit',
    category: 'electronics',
    baseMonthlyRent: 1299,
    depositAmount: 3000,
    imageUrl: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600',
    description: 'Laptop + monitor + ergonomic chair + study desk.',
  },
];

async function main() {
  const adminPassword = await bcrypt.hash('admin12345', 10);
  const customerPassword = await bcrypt.hash('demo12345', 10);

  await prisma.user.upsert({
    where: { email: 'admin@rentomojo.local' },
    update: {},
    create: {
      email: 'admin@rentomojo.local',
      passwordHash: adminPassword,
      fullName: 'Rentomojo Admin',
      role: 'ADMIN',
      city: 'Bangalore',
    },
  });

  await prisma.user.upsert({
    where: { email: 'demo@rentomojo.local' },
    update: {},
    create: {
      email: 'demo@rentomojo.local',
      passwordHash: customerPassword,
      fullName: 'Demo Customer',
      city: 'Bangalore',
    },
  });

  const categoryMap = new Map<string, string>();
  for (const c of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, iconName: c.iconName },
      create: c,
    });
    categoryMap.set(c.slug, cat.id);
  }

  for (const p of PRODUCTS) {
    for (const city of CITIES) {
      const slug = `${p.slug}-${city.toLowerCase()}`;
      await prisma.product.upsert({
        where: { slug },
        update: {
          name: p.name,
          description: p.description,
          imageUrl: p.imageUrl,
          city,
          baseMonthlyRent: p.baseMonthlyRent,
          depositAmount: p.depositAmount,
          discount3M: 0,
          discount6M: 0.05,
          discount12M: 0.1,
          stock: 10,
          isActive: true,
          categoryId: categoryMap.get(p.category)!,
        },
        create: {
          slug,
          name: p.name,
          description: p.description,
          imageUrl: p.imageUrl,
          city,
          baseMonthlyRent: p.baseMonthlyRent,
          depositAmount: p.depositAmount,
          discount3M: 0,
          discount6M: 0.05,
          discount12M: 0.1,
          stock: 10,
          isActive: true,
          categoryId: categoryMap.get(p.category)!,
        },
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Seed complete: ${CATEGORIES.length} categories, ${PRODUCTS.length * CITIES.length} products.`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
