import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Upgrading admin user 9999999999 to Active Paid Subscriber...');
  
  // Find admin user
  const user = await prisma.user.findFirst({
    where: { phone: '9999999999' }
  });

  if (!user) {
    console.error('User with phone 9999999999 not found in database.');
    return;
  }

  // Set subscription end date to 1 year from now
  const subEndDate = new Date();
  subEndDate.setFullYear(subEndDate.getFullYear() + 1);

  // Check if user already has a subscription
  const existingSub = await prisma.subscription.findFirst({
    where: { userId: user.id }
  });

  let subscription;
  if (existingSub) {
    subscription = await prisma.subscription.update({
      where: { id: existingSub.id },
      data: {
        status: 'ACTIVE',
        endDate: subEndDate,
        amount: 1500.0
      }
    });
  } else {
    subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        status: 'ACTIVE',
        amount: 1500.0,
        startDate: new Date(),
        endDate: subEndDate,
        razorpayOrderId: 'order_admin_test_paid',
        razorpaySubscriptionId: 'sub_admin_test_paid'
      }
    });
  }

  // Create payment record if it doesn't exist
  await prisma.payment.upsert({
    where: { razorpayOrderId: 'order_admin_test_paid' },
    update: { status: 'SUCCESS' },
    create: {
      userId: user.id,
      subscriptionId: subscription.id,
      amount: 1500.0,
      status: 'SUCCESS',
      razorpayOrderId: 'order_admin_test_paid',
      razorpayPaymentId: 'pay_admin_test_paid',
      invoiceNumber: 'INV-ADMIN-0001'
    }
  });

  console.log(`Success! User ${user.name} (${user.phone}) is now an ACTIVE paid subscriber until ${subEndDate.toLocaleDateString()}`);
}

main()
  .catch((err) => {
    console.error('Error running script:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
