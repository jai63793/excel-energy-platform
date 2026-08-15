import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Roles
  const roles = [
    { id: 1, name: 'ADMIN' },
    { id: 2, name: 'USER' },
    { id: 3, name: 'EMPLOYEE' },
    { id: 4, name: 'VOLUNTEER' }
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: { name: role.name },
      create: { id: role.id, name: role.name }
    });
  }
  console.log('Roles seeded: ADMIN, USER, EMPLOYEE, VOLUNTEER');

  // Helper for robust user creation/upsertion (checks both phone and username uniqueness)
  const upsertUserRobust = async ({ phone, username, name, email, passwordHash, roleId, status }) => {
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone },
          { username }
        ]
      }
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          phone,
          username,
          name,
          email,
          passwordHash,
          roleId,
          status
        }
      });
    } else {
      user = await prisma.user.create({
        data: {
          username,
          name,
          phone,
          email,
          passwordHash,
          roleId,
          status
        }
      });
    }
    return user;
  };

  // 2. Create Default Admin User
  const adminPhone = process.env.SEED_ADMIN_PHONE;
  const adminUsername = process.env.SEED_ADMIN_USERNAME;
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminPhone || !adminUsername || !adminPassword) {
    throw new Error('Seed admin credentials missing in environment variables.');
  }
  
  // Hash standard admin password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(adminPassword, salt);

  const adminUser = await upsertUserRobust({
    phone: adminPhone,
    username: adminUsername,
    name: 'Excel Energy Admin',
    email: adminEmail,
    passwordHash: passwordHash,
    roleId: 1, // ADMIN
    status: 'ACTIVE'
  });

  // 3. Create Default System Settings if not exists
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      companyName: 'Excel Energy',
      gstNumber: '29AAAAA0000A1Z5',
      logo: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=150&auto=format&fit=crop',
      address: 'No. 45, 8th Cross, Malleshwaram, Bangalore - 560003',
      email: 'info@excelenergy.com',
      phone: '+91 83107 28826',
      razorpayKeyId: 'rzp_test_yourkeyhere',
      razorpayKeySecret: 'yourkeysecrethere',
      smsApiKey: 'mock_sms_api_key',
      whatsappApiKey: 'mock_whatsapp_key',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: 'info@excelenergy.com',
      smtpPass: 'mockpass'
    }
  });

  console.log('Admin user created:', adminUser.username);
  console.log('Default settings created.');

  // 4. Create Demo Users & Subscriptions
  console.log('Seeding Demo Users and Profiles...');
  const seedUserPhone = process.env.SEED_USER_PHONE;
  const seedUserUsername = process.env.SEED_USER_USERNAME;
  const seedUserEmail = process.env.SEED_USER_EMAIL;
  const seedUserPassword = process.env.SEED_USER_PASSWORD;

  const seedUnpaidUserPhone = process.env.SEED_UNPAID_USER_PHONE;
  const seedUnpaidUserUsername = process.env.SEED_UNPAID_USER_USERNAME;
  const seedUnpaidUserEmail = process.env.SEED_UNPAID_USER_EMAIL;
  const seedUnpaidUserPassword = process.env.SEED_UNPAID_USER_PASSWORD;

  const seedHealerPhone = process.env.SEED_HEALER_PHONE;
  const seedHealerUsername = process.env.SEED_HEALER_USERNAME;
  const seedHealerEmail = process.env.SEED_HEALER_EMAIL;
  const seedHealerPassword = process.env.SEED_HEALER_PASSWORD;

  if (
    !seedUserPhone || !seedUserUsername || !seedUserPassword ||
    !seedUnpaidUserPhone || !seedUnpaidUserUsername || !seedUnpaidUserPassword ||
    !seedHealerPhone || !seedHealerUsername || !seedHealerPassword
  ) {
    throw new Error('Seed demo user credentials missing in environment variables.');
  }

  const userPasswordHash = await bcrypt.hash(seedUserPassword, salt);
  const unpaidUserPasswordHash = await bcrypt.hash(seedUnpaidUserPassword, salt);
  const healerPasswordHash = await bcrypt.hash(seedHealerPassword, salt);

  // Demo Paid Subscriber
  const paidUser = await upsertUserRobust({
    phone: seedUserPhone,
    username: seedUserUsername,
    name: 'Amit Patel',
    email: seedUserEmail,
    passwordHash: userPasswordHash,
    roleId: 2,
    status: 'ACTIVE'
  });

  const subEndDate = new Date();
  subEndDate.setFullYear(subEndDate.getFullYear() + 1);

  const sub = await prisma.subscription.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      userId: paidUser.id,
      status: 'ACTIVE',
      amount: 1500.0,
      startDate: new Date(),
      endDate: subEndDate,
      razorpayOrderId: 'order_paid_demo',
      razorpaySubscriptionId: 'sub_paid_demo'
    }
  });

  await prisma.payment.upsert({
    where: { razorpayOrderId: 'order_paid_demo' },
    update: {},
    create: {
      userId: paidUser.id,
      subscriptionId: sub.id,
      amount: 1500.0,
      status: 'SUCCESS',
      razorpayOrderId: 'order_paid_demo',
      razorpayPaymentId: 'pay_paid_demo',
      invoiceNumber: 'INV-2026-0001'
    }
  });

  // Demo Unpaid / Expired User
  const unpaidUser = await upsertUserRobust({
    phone: seedUnpaidUserPhone,
    username: seedUnpaidUserUsername,
    name: 'Neha Singh',
    email: seedUnpaidUserEmail,
    passwordHash: unpaidUserPasswordHash,
    roleId: 2,
    status: 'ACTIVE'
  });

  // Demo Energy Healer (Employee)
  const healerUser = await upsertUserRobust({
    phone: seedHealerPhone,
    username: seedHealerUsername,
    name: 'Dr. Rajesh Iyer',
    email: seedHealerEmail,
    passwordHash: healerPasswordHash,
    roleId: 3,
    status: 'ACTIVE'
  });

  await prisma.employeeProfile.upsert({
    where: { userId: healerUser.id },
    update: {},
    create: {
      userId: healerUser.id,
      specialization: 'Advanced Pranic Healer',
      dutyStatus: 'ON_DUTY',
      availability: JSON.stringify({
        Monday: '09:00 AM - 05:00 PM',
        Tuesday: '09:00 AM - 05:00 PM',
        Wednesday: '09:00 AM - 05:00 PM',
        Thursday: '09:00 AM - 05:00 PM',
        Friday: '09:00 AM - 05:00 PM',
        Saturday: '10:00 AM - 02:00 PM',
        Sunday: 'Closed'
      }),
      bio: 'Experienced healer with 15+ years of practice in energy scanning and aura balancing.',
      rating: 4.9
    }
  });

  // 5. Create Contact Form Messages
  console.log('Seeding Contact Form Messages...');
  const contactMessages = [
    {
      name: 'Vikram Malhotra',
      email: 'vikram@gmail.com',
      phone: '9123456789',
      message: 'Simple Physical Healing: Interested in the 1-on-1 healing session. Can I book for my parents?',
      status: 'UNREAD'
    },
    {
      name: 'Suresh Kumar',
      email: 'suresh@gmail.com',
      phone: '9812345678',
      message: 'Twin Hearts Meditation: Is the Twin Hearts meditation suitable for beginners?',
      status: 'UNREAD'
    },
    {
      name: 'Deepa Rao',
      email: 'deepa@gmail.com',
      phone: '9001234567',
      message: 'Corporate Wellness: Can we get a GST invoice for company billing?',
      status: 'READ'
    }
  ];

  for (const msg of contactMessages) {
    const existing = await prisma.contactForm.findFirst({
      where: { phone: msg.phone, message: msg.message }
    });
    if (!existing) {
      await prisma.contactForm.create({
        data: msg
      });
    }
  }

  // 6. Create Live Sessions
  console.log('Seeding Live Sessions...');
  const liveSessions = [
    {
      title: 'Twin Hearts Guided Meditation',
      description: 'Experience deep peace and illumination with this guided meditation.',
      hostName: 'Dr. Rajesh Iyer',
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days later
      durationMinutes: 60,
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      type: 'MEDITATION',
      status: 'UPCOMING',
      maxParticipants: 100
    },
    {
      title: 'Aura Cleansing Masterclass',
      description: 'Learn the basic techniques to scan and cleanse your energy aura.',
      hostName: 'Dr. Rajesh Iyer',
      scheduledAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      durationMinutes: 45,
      meetingUrl: 'https://www.youtube.com/watch?v=live_session_id',
      type: 'WORKSHOP',
      status: 'LIVE',
      maxParticipants: 150
    }
  ];

  for (const session of liveSessions) {
    const existing = await prisma.liveSession.findFirst({
      where: { title: session.title }
    });
    if (!existing) {
      await prisma.liveSession.create({
        data: session
      });
    }
  }

  // 7. Seed Bookings
  console.log('Seeding Bookings...');
  const bookingDate = new Date();
  bookingDate.setDate(bookingDate.getDate() + 1); // tomorrow

  const existingBooking = await prisma.booking.findFirst({
    where: { userId: paidUser.id, healerId: healerUser.id }
  });
  if (!existingBooking) {
    await prisma.booking.create({
      data: {
        userId: paidUser.id,
        healerId: healerUser.id,
        sessionType: '1-on-1 Distance Healing',
        bookingDate: bookingDate,
        timeSlot: '10:00 AM - 11:00 AM',
        status: 'CONFIRMED',
        amount: 500.0,
        notes: 'Amit requested special focus on solar plexus and heart chakras.'
      }
    });
  }

  // 8. Seed Notifications & Link UserNotifications
  console.log('Seeding Notifications...');
  const existingNotifications = await prisma.notification.findMany();
  if (existingNotifications.length === 0) {
    const notif1 = await prisma.notification.create({
      data: {
        title: 'Welcome to Excel Energy! 🧘',
        description: 'Start your healing journey by booking your first session or joining guidance events.',
        targetAudience: 'ALL',
        status: 'SENT'
      }
    });

    const notif2 = await prisma.notification.create({
      data: {
        title: 'Exclusive Paid Member Retreat 🌿',
        description: 'Register for the upcoming online Pranic Healing weekend retreat. Checking credentials at zoom gate.',
        targetAudience: 'PAID',
        status: 'SENT'
      }
    });

    await prisma.userNotification.createMany({
      data: [
        {
          userId: paidUser.id,
          notificationId: notif1.id,
          isRead: false
        },
        {
          userId: paidUser.id,
          notificationId: notif2.id,
          isRead: false
        },
        {
          userId: unpaidUser.id,
          notificationId: notif1.id,
          isRead: false
        }
      ]
    });
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
