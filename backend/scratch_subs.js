import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const subs = await prisma.subscription.findMany({
    include: { user: true }
  });
  console.log('Subscriptions List:');
  subs.forEach(s => {
    console.log(`- Sub ID: ${s.id}, User: ${s.user.name} (${s.user.phone}), Status: ${s.status}, Start: ${s.startDate.toLocaleDateString()}, End: ${s.endDate.toLocaleDateString()}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
