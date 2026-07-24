import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { role: true, subscriptions: true }
  });
  console.log('Registered Users in DB:');
  users.forEach(u => {
    console.log(`- ID: ${u.id}, Name: ${u.name}, Phone: ${u.phone}, Role: ${u.role.name}, Status: ${u.status}, Subs Count: ${u.subscriptions.length}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
