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
      role: 'admin',
      password_hash: hashedPassword,
    },
    create: {
      email: adminEmail,
      username: 'stusil_admin',
      full_name: 'Tanisha ',
      password_hash: hashedPassword,
      role: 'admin',
      bio: 'System Administrator',
    },
  });

  // Ensure portfolio exists
  await prisma.portfolio.upsert({
    where: { user_id: user.id },
    update: {},
    create: {
      user_id: user.id,
      bio: 'System Administrator',
      skills: JSON.stringify(['Security', 'Management', 'Automation']),
    }
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
