const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url:
          process.env.DATABASE_URL ||
          'postgresql://codex:codex@localhost:5487/codex_bootstrap?schema=public',
      },
    },
  });

  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`✅ Database query successful: ${userCount} users found`);
  } catch (error) {
    console.log(`❌ Database connection failed: ${error.message}`);

    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 PostgreSQL server is not running on localhost:5487');
    } else if (error.message.includes('does not exist')) {
      console.log('💡 Database or schema does not exist - try running migrations');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();
