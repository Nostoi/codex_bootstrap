import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample users
  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      name: 'John Doe',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      name: 'Jane Smith',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
    },
  });

  // Create sample document
  const document1 = await prisma.document.upsert({
    where: { id: 'sample-doc-1' },
    update: {},
    create: {
      id: 'sample-doc-1',
      title: 'Welcome to Codex Bootstrap',
      content: 'This is a sample collaborative document.',
      ownerId: user1.id,
    },
  });

  console.log('✅ Database seeded successfully');
  console.log({ user1, user2, document1 });
}

main()
  .catch(e => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
