const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ select: { username: true, full_name: true } });
  console.log('COUNT:', users.length);
  users.forEach(u => console.log('USER:', u.username, '| NAME:', u.full_name));
}
main().catch(console.error).finally(() => prisma.$disconnect());
