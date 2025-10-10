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

async function getSessionFromDatabase() {
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
      take: 5
    });

    if (sessions.length === 0) {
      console.log('❌ No sessions found in database');
      return null;
    }

    console.log(`Found ${sessions.length} sessions:`);
    sessions.forEach((session, index) => {
      console.log(`${index + 1}. User: ${session.user.email} (${session.user.role})`);
      console.log(`   Token: ${session.token.substring(0, 20)}...`);
      console.log(`   Expires: ${session.expiresAt}`);
      console.log(`   Created: ${session.createdAt}`);
      console.log('');
    });

    // Get the most recent valid session
    const validSession = sessions.find(session =>
      new Date(session.expiresAt) > new Date()
    );

    if (validSession) {
      console.log(`✅ Using valid session for user: ${validSession.user.email}`);
      return {
        token: validSession.token,
        userId: validSession.user.id,
        email: validSession.user.email,
        role: validSession.user.role
      };
    } else {
      console.log('❌ No valid sessions found (all expired)');
      return null;
    }

  } catch (error) {
    console.error('❌ Error getting sessions:', error);
    return null;
  }
}

async function makeAuthenticatedRequest(url, options = {}, sessionToken) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `Better-Auth.session_token=${sessionToken}`,
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testPaymentMethods(sessionToken) {
  console.log('💳 Testing Payment Methods API...\n');

  // Test GET payment methods (should be empty initially)
  console.log('1. Getting payment methods...');
  const getResponse = await makeAuthenticatedRequest(`${BASE_URL}/api/user/payment-methods`, {}, sessionToken);
  console.log(`Status: ${getResponse.status}, Success: ${getResponse.success}`);
  if (getResponse.success) {
    console.log(`Payment methods count: ${getResponse.data.paymentMethods?.length || 0}`);
  } else {
    console.log(`Error: ${getResponse.data?.error}`);
  }
  console.log('');

  // Test POST bank account
  console.log('2. Creating bank account...');
  const bankResponse = await makeAuthenticatedRequest(`${BASE_URL}/api/user/payment-methods`, {
    method: 'POST',
    body: JSON.stringify(testBankAccount)
  }, sessionToken);
  console.log(`Status: ${bankResponse.status}, Success: ${bankResponse.success}`);
  let bankAccountId = null;
  if (bankResponse.success) {
    console.log(`Bank account created: ${bankResponse.data.paymentMethod?.bankName}`);
    bankAccountId = bankResponse.data.paymentMethod.id;
  } else {
    console.log(`Error: ${bankResponse.data?.error}`);
  }
  console.log('');

  // Test GET payment methods again
  console.log('3. Getting payment methods after creation...');
  const getResponse2 = await makeAuthenticatedRequest(`${BASE_URL}/api/user/payment-methods`, {}, sessionToken);
  console.log(`Status: ${getResponse2.status}, Success: ${getResponse2.success}`);
  if (getResponse2.success) {
    console.log(`Payment methods count: ${getResponse2.data.paymentMethods?.length || 0}`);
    getResponse2.data.paymentMethods?.forEach(method => {
      console.log(`- ${method.type}: ${method.type === 'BANK_ACCOUNT' ? method.bankName : method.upiId} (Default: ${method.isDefault})`);
    });
  }
  console.log('');

  return bankAccountId;
}

async function testWithdrawalRequests(paymentMethodId, sessionToken) {
  console.log('📋 Testing Withdrawal Requests API...\n');

  if (!paymentMethodId) {
    console.log('❌ No payment method available for testing withdrawal requests');
    return null;
  }

  // Test GET withdrawal requests (should be empty initially)
  console.log('1. Getting withdrawal requests...');
  const getResponse = await makeAuthenticatedRequest(`${BASE_URL}/api/user/withdrawal-requests`, {}, sessionToken);
  console.log(`Status: ${getResponse.status}, Success: ${getResponse.success}`);
  if (getResponse.success) {
    console.log(`Withdrawal requests count: ${getResponse.data.withdrawalRequests?.length || 0}`);
  }
  console.log('');

  // Test POST withdrawal request - valid amount
  console.log('2. Creating withdrawal request (₹500)...');
  const withdrawResponse = await makeAuthenticatedRequest(`${BASE_URL}/api/user/withdrawal-requests`, {
    method: 'POST',
    body: JSON.stringify({
      withdrawalMethodId: paymentMethodId,
      amount: 500
    })
  }, sessionToken);
  console.log(`Status: ${withdrawResponse.status}, Success: ${withdrawResponse.success}`);
  let withdrawalRequestId = null;
  if (withdrawResponse.success) {
    console.log(`Withdrawal request created: ₹${withdrawResponse.data.withdrawalRequest?.amount} (${withdrawResponse.data.withdrawalRequest?.status})`);
    withdrawalRequestId = withdrawResponse.data.withdrawalRequest.id;
  } else {
    console.log(`Error: ${withdrawResponse.data?.error}`);
  }
  console.log('');

  // Test POST withdrawal request - invalid amount (too low)
  console.log('3. Testing invalid amount (₹200 - below minimum)...');
  const invalidResponse = await makeAuthenticatedRequest(`${BASE_URL}/api/user/withdrawal-requests`, {
    method: 'POST',
    body: JSON.stringify({
      withdrawalMethodId: paymentMethodId,
      amount: 200
    })
  }, sessionToken);
  console.log(`Status: ${invalidResponse.status}, Success: ${invalidResponse.success}`);
  if (!invalidResponse.success) {
    console.log(`Expected error: ${invalidResponse.data?.error}`);
  }
  console.log('');

  // Test GET withdrawal requests again
  console.log('4. Getting withdrawal requests after creation...');
  const getResponse2 = await makeAuthenticatedRequest(`${BASE_URL}/api/user/withdrawal-requests`, {}, sessionToken);
  console.log(`Status: ${getResponse2.status}, Success: ${getResponse2.success}`);
  if (getResponse2.success) {
    console.log(`Withdrawal requests count: ${getResponse2.data.withdrawalRequests?.length || 0}`);
    getResponse2.data.withdrawalRequests?.forEach(request => {
      console.log(`- ₹${request.amount} to ${request.withdrawalMethod?.type}: ${request.withdrawalMethod?.bankName || request.withdrawalMethod?.upiId} (${request.status})`);
    });
  }
  console.log('');

  return withdrawalRequestId;
}

async function testWalletBalance(sessionToken) {
  console.log('💰 Testing Wallet API...\n');

  // Test GET wallet
  console.log('1. Getting wallet balance...');
  const walletResponse = await makeAuthenticatedRequest(`${BASE_URL}/api/wallet`, {}, sessionToken);
  console.log(`Status: ${walletResponse.status}, Success: ${walletResponse.success}`);
  if (walletResponse.success) {
    console.log(`Wallet Balance: ₹${walletResponse.data.wallet?.balance || 0}`);
    console.log(`Currency: ${walletResponse.data.wallet?.currency || 'INR'}`);
  } else {
    console.log(`Error: ${walletResponse.data?.error}`);
  }
  console.log('');
}

async function testAdminApis(withdrawalRequestId, sessionToken) {
  console.log('👑 Testing Admin APIs...\n');

  if (!withdrawalRequestId) {
    console.log('❌ No withdrawal request available for testing admin APIs');
    return;
  }

  // Test GET admin withdrawal requests
  console.log('1. Getting admin withdrawal requests...');
  const adminGetResponse = await makeAuthenticatedRequest(`${BASE_URL}/api/admin/withdrawal-requests`, {}, sessionToken);
  console.log(`Status: ${adminGetResponse.status}, Success: ${adminGetResponse.success}`);
  if (adminGetResponse.success) {
    console.log(`Admin withdrawal requests count: ${adminGetResponse.data.withdrawalRequests?.length || 0}`);
    console.log(`Statistics:`, adminGetResponse.data.statistics);
  } else {
    console.log(`Error: ${adminGetResponse.data?.error}`);
  }
  console.log('');

  // Test GET specific withdrawal request
  console.log('2. Getting specific withdrawal request...');
  const specificResponse = await makeAuthenticatedRequest(`${BASE_URL}/api/admin/withdrawal-requests/${withdrawalRequestId}`, {}, sessionToken);
  console.log(`Status: ${specificResponse.status}, Success: ${specificResponse.success}`);
  if (specificResponse.success) {
    const request = specificResponse.data.withdrawalRequest;
    console.log(`Request: ₹${request.amount} (${request.status})`);
    console.log(`User: ${request.user?.email}`);
    console.log(`Method: ${request.withdrawalMethod?.type}`);
  } else {
    console.log(`Error: ${specificResponse.data?.error}`);
  }
  console.log('');

  // Test PUT approve withdrawal request
  console.log('3. Approving withdrawal request...');
  const approveResponse = await makeAuthenticatedRequest(`${BASE_URL}/api/admin/withdrawal-requests/${withdrawalRequestId}`, {
    method: 'PUT',
    body: JSON.stringify({
      status: 'APPROVED',
      adminNotes: 'Test approval via session'
    })
  }, sessionToken);
  console.log(`Status: ${approveResponse.status}, Success: ${approveResponse.success}`);
  if (approveResponse.success) {
    const request = approveResponse.data.withdrawalRequest;
    console.log(`Request approved: ₹${request.amount} (${request.status})`);
  } else {
    console.log(`Error: ${approveResponse.data?.error}`);
  }
  console.log('');
}

async function main() {
  console.log('🚀 Testing Withdrawal API Functionality with Database Session\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  try {
    // Get session from database
    const session = await getSessionFromDatabase();

    if (!session) {
      console.log('❌ Cannot proceed without valid session');
      return;
    }

    console.log(`Using session for: ${session.email} (${session.role})\n`);

    // Test wallet first
    await testWalletBalance(session.token);

    // Test payment methods
    const bankAccountId = await testPaymentMethods(session.token);

    // Test withdrawal requests
    const withdrawalRequestId = await testWithdrawalRequests(bankAccountId, session.token);

    // Test admin APIs (only if user is admin)
    if (session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') {
      await testAdminApis(withdrawalRequestId, session.token);
    } else {
      console.log('👑 Skipping admin tests - user is not an admin\n');
    }

    console.log('✅ All API tests completed!');

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();