const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

const BASE_URL = 'https://rolf-prothallium-semiseriously.ngrok-free.dev';

// Test data
const testBankAccount = {
  type: "BANK_ACCOUNT",
  accountName: "Test User",
  accountNumber: "1234567890123456",
  bankName: "Test Bank",
  ifscCode: "SBIN0001234",
  isDefault: true
};

async function getValidSession() {
  console.log('🔍 Getting session from database...\n');

  try {
    const sessions = await prisma.session.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1
    });

    if (sessions.length === 0) {
      console.log('❌ No sessions found in database');
      return null;
    }

    const session = sessions[0];

    // Check if session is still valid
    if (new Date(session.expiresAt) <= new Date()) {
      console.log('❌ Session has expired');
      return null;
    }

    console.log(`✅ Found valid session:`);
    console.log(`   User: ${session.user.email} (${session.user.role})`);
    console.log(`   Token: ${session.token}`);
    console.log(`   Expires: ${session.expiresAt}`);

    return session;

  } catch (error) {
    console.error('❌ Error getting session:', error);
    return null;
  }
}

async function testWithSessionToken(sessionToken) {
  console.log('\n🧪 Testing APIs with session token...\n');

  let cookies = `session_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax`;

  try {
    // Test wallet API
    console.log('1. Testing wallet API...');
    const walletResponse = await fetch(`${BASE_URL}/api/wallet`, {
      headers: {
        'Cookie': cookies
      }
    });

    console.log(`Status: ${walletResponse.status}`);
    if (walletResponse.ok) {
      const walletData = await walletResponse.json();
      console.log(`✅ Wallet Balance: ₹${walletData.wallet?.balance || 0}`);
    } else {
      const errorData = await walletResponse.json();
      console.log(`❌ Error: ${errorData.error}`);
    }

    // Test payment methods API
    console.log('\n2. Testing payment methods API...');
    const paymentMethodsResponse = await fetch(`${BASE_URL}/api/user/payment-methods`, {
      headers: {
        'Cookie': cookies
      }
    });

    console.log(`Status: ${paymentMethodsResponse.status}`);
    if (paymentMethodsResponse.ok) {
      const paymentData = await paymentMethodsResponse.json();
      console.log(`✅ Payment methods count: ${paymentData.paymentMethods?.length || 0}`);
    } else {
      const errorData = await paymentMethodsResponse.json();
      console.log(`❌ Error: ${errorData.error}`);
    }

    // Test creating a payment method
    console.log('\n3. Testing create payment method...');
    const createPaymentResponse = await fetch(`${BASE_URL}/api/user/payment-methods`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify(testBankAccount)
    });

    console.log(`Status: ${createPaymentResponse.status}`);
    if (createPaymentResponse.ok) {
      const createData = await createPaymentResponse.json();
      console.log(`✅ Bank account created: ${createData.paymentMethod?.bankName}`);

      // Test withdrawal request
      console.log('\n4. Testing withdrawal request...');
      const withdrawResponse = await fetch(`${BASE_URL}/api/user/withdrawal-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        body: JSON.stringify({
          withdrawalMethodId: createData.paymentMethod.id,
          amount: 500
        })
      });

      console.log(`Status: ${withdrawResponse.status}`);
      if (withdrawResponse.ok) {
        const withdrawData = await withdrawResponse.json();
        console.log(`✅ Withdrawal request created: ₹${withdrawData.withdrawalRequest?.amount} (${withdrawData.withdrawalRequest?.status})`);

        // Test admin approval
        console.log('\n5. Testing admin approval...');
        const approveResponse = await fetch(`${BASE_URL}/api/admin/withdrawal-requests/${withdrawData.withdrawalRequest.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': cookies
          },
          body: JSON.stringify({
            status: 'APPROVED',
            adminNotes: 'Test approval via API'
          })
        });

        console.log(`Status: ${approveResponse.status}`);
        if (approveResponse.ok) {
          const approveData = await approveResponse.json();
          console.log(`✅ Withdrawal approved: ₹${approveData.withdrawalRequest?.amount} (${approveData.withdrawalRequest?.status})`);
        } else {
          const approveError = await approveResponse.json();
          console.log(`❌ Approval error: ${approveError.error}`);
        }
      } else {
        const withdrawError = await withdrawResponse.json();
        console.log(`❌ Withdrawal error: ${withdrawError.error}`);
      }
    } else {
      const createError = await createPaymentResponse.json();
      console.log(`❌ Create payment error: ${createError.error}`);
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

async function testDirectDatabase() {
  console.log('\n🗄️ Testing direct database operations...\n');

  try {
    // Create a payment method directly in database
    console.log('1. Creating payment method directly...');
    const user = await prisma.user.findFirst({
      where: { email: 'dixitrayaan@gmail.com' }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    const paymentMethod = await prisma.withdrawalMethod.create({
      data: {
        userId: user.id,
        type: 'BANK_ACCOUNT',
        accountName: 'Direct Test User',
        accountNumber: '9876543210987654',
        bankName: 'Direct Test Bank',
        ifscCode: 'HDFC0004321',
        isDefault: true,
        isActive: true
      }
    });

    console.log(`✅ Payment method created: ${paymentMethod.bankName} (ID: ${paymentMethod.id})`);

    // Create a withdrawal request directly
    console.log('\n2. Creating withdrawal request directly...');
    const withdrawalRequest = await prisma.withdrawalRequest.create({
      data: {
        userId: user.id,
        withdrawalMethodId: paymentMethod.id,
        amount: 750,
        currency: 'INR',
        status: 'PENDING'
      },
      include: {
        withdrawalMethod: true,
        user: {
          select: {
            email: true,
            role: true
          }
        }
      }
    });

    console.log(`✅ Withdrawal request created: ₹${withdrawalRequest.amount} (${withdrawalRequest.status})`);
    console.log(`   User: ${withdrawalRequest.user.email}`);
    console.log(`   Method: ${withdrawalRequest.withdrawalMethod.bankName}`);

    // Test admin approval via API
    console.log('\n3. Testing admin approval via API...');
    const session = await getValidSession();

    if (session) {
      let cookies = `session_token=${session.token}; Path=/; HttpOnly; SameSite=Lax`;

      const approveResponse = await fetch(`${BASE_URL}/api/admin/withdrawal-requests/${withdrawalRequest.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        body: JSON.stringify({
          status: 'APPROVED',
          adminNotes: 'Direct test approval'
        })
      });

      console.log(`Status: ${approveResponse.status}`);
      if (approveResponse.ok) {
        const approveData = await approveResponse.json();
        console.log(`✅ Direct withdrawal approved: ₹${approveData.withdrawalRequest?.amount} (${approveData.withdrawalRequest?.status})`);
      } else {
        const approveError = await approveResponse.json();
        console.log(`❌ Direct approval error: ${approveError.error}`);
      }
    }

    // Clean up test data
    console.log('\n4. Cleaning up test data...');
    await prisma.withdrawalRequest.delete({
      where: { id: withdrawalRequest.id }
    });
    await prisma.withdrawalMethod.delete({
      where: { id: paymentMethod.id }
    });
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Direct database test error:', error);
  }
}

async function main() {
  console.log('🚀 Testing Withdrawal APIs with Better Auth Sessions\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  try {
    // Get valid session
    const session = await getValidSession();

    if (session) {
      // Test with session token
      await testWithSessionToken(session.token);
    }

    // Test direct database operations
    await testDirectDatabase();

    console.log('\n✅ All tests completed!');

  } catch (error) {
    console.error('❌ Main test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();