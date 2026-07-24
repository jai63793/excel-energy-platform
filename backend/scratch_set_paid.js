import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Upgrading test user to Active Paid Subscriber...');
  
  // Find user by phone number (checks both formats)
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: '9876543210' },
        { phone: '+919876543210' }
      ]
    }
  });

  if (!user) {
    console.error('Test user Amit Patel not found in database. Seeding him first...');
    // Create user
    user = await prisma.user.create({
      data: {
        username: 'excel_user_paid',
        name: 'Amit Patel',
        phone: '+919876543210',
        email: 'amit@gmail.com',
        roleId: 2,
        status: 'ACTIVE'
      }
    });
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
        razorpayOrderId: 'order_test_mode_upgrade',
        razorpaySubscriptionId: 'sub_test_mode_upgrade'
      }
    });
  }

  // Create payment record if it doesn't exist
  await prisma.payment.upsert({
    where: { razorpayOrderId: 'order_test_mode_upgrade' },
    update: { status: 'SUCCESS' },
    create: {
      userId: user.id,
      subscriptionId: subscription.id,
      amount: 1500.0,
      status: 'SUCCESS',
      razorpayOrderId: 'order_test_mode_upgrade',
      razorpayPaymentId: 'pay_test_mode_upgrade',
      invoiceNumber: 'INV-TEST-0001'
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
