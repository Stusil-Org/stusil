const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  const adminEmail = 'stusil.org@gmail.com';
  const adminPassword = 'Stusil@123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  console.log('--- Connecting to Database ---');
  
  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'Admin',
      password: hashedPassword,
    },
    create: {
      email: adminEmail,
      username: 'stusil_admin',
      name: 'Stusil Admin',
      password: hashedPassword,
      role: 'Admin',
      bio: 'System Administrator',
    },
  });

  console.log('✅ Admin User Ready!');
  console.log('Email:', user.email);
  console.log('Role:', user.role);
}

main()
  .catch((e) => {
    console.error('❌ Error setting up admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
