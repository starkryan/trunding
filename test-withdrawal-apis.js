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

const testUpi = {
  type: "UPI",
  upiId: "testuser@paytm",
  upiName: "Test User",
  phoneNumber: "9876543210",
  isDefault: false
};

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
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

async function testPaymentMethods() {
  console.log('💳 Testing Payment Methods API...\n');

  // Test GET payment methods (should be empty initially)
  console.log('1. Getting payment methods...');
  const getResponse = await makeRequest(`${BASE_URL}/api/user/payment-methods`);
  console.log(`Status: ${getResponse.status}, Success: ${getResponse.success}`);
  if (getResponse.success) {
    console.log(`Payment methods count: ${getResponse.data.paymentMethods?.length || 0}`);
  }
  console.log('');

  // Test POST bank account
  console.log('2. Creating bank account...');
  const bankResponse = await makeRequest(`${BASE_URL}/api/user/payment-methods`, {
    method: 'POST',
    body: JSON.stringify(testBankAccount)
  });
  console.log(`Status: ${bankResponse.status}, Success: ${bankResponse.success}`);
  if (bankResponse.success) {
    console.log(`Bank account created: ${bankResponse.data.paymentMethod?.bankName}`);
    bankAccountId = bankResponse.data.paymentMethod.id;
  } else {
    console.log(`Error: ${bankResponse.data?.error || bankResponse.error}`);
  }
  console.log('');

  // Test POST UPI
  console.log('3. Creating UPI method...');
  const upiResponse = await makeRequest(`${BASE_URL}/api/user/payment-methods`, {
    method: 'POST',
    body: JSON.stringify(testUpi)
  });
  console.log(`Status: ${upiResponse.status}, Success: ${upiResponse.success}`);
  if (upiResponse.success) {
    console.log(`UPI created: ${upiResponse.data.paymentMethod?.upiId}`);
    upiId = upiResponse.data.paymentMethod.id;
  } else {
    console.log(`Error: ${upiResponse.data?.error || upiResponse.error}`);
  }
  console.log('');

  // Test GET payment methods again
  console.log('4. Getting payment methods after creation...');
  const getResponse2 = await makeRequest(`${BASE_URL}/api/user/payment-methods`);
  console.log(`Status: ${getResponse2.status}, Success: ${getResponse2.success}`);
  if (getResponse2.success) {
    console.log(`Payment methods count: ${getResponse2.data.paymentMethods?.length || 0}`);
    getResponse2.data.paymentMethods?.forEach(method => {
      console.log(`- ${method.type}: ${method.type === 'BANK_ACCOUNT' ? method.bankName : method.upiId} (Default: ${method.isDefault})`);
    });
  }
  console.log('');

  return { bankAccountId, upiId };
}

async function testWithdrawalRequests(paymentMethodId) {
  console.log('📋 Testing Withdrawal Requests API...\n');

  if (!paymentMethodId) {
    console.log('❌ No payment method available for testing withdrawal requests');
    return;
  }

  // Test GET withdrawal requests (should be empty initially)
  console.log('1. Getting withdrawal requests...');
  const getResponse = await makeRequest(`${BASE_URL}/api/user/withdrawal-requests`);
  console.log(`Status: ${getResponse.status}, Success: ${getResponse.success}`);
  if (getResponse.success) {
    console.log(`Withdrawal requests count: ${getResponse.data.withdrawalRequests?.length || 0}`);
  }
  console.log('');

  // Test POST withdrawal request - valid amount
  console.log('2. Creating withdrawal request (₹500)...');
  const withdrawResponse = await makeRequest(`${BASE_URL}/api/user/withdrawal-requests`, {
    method: 'POST',
    body: JSON.stringify({
      withdrawalMethodId: paymentMethodId,
      amount: 500
    })
  });
  console.log(`Status: ${withdrawResponse.status}, Success: ${withdrawResponse.success}`);
  if (withdrawResponse.success) {
    console.log(`Withdrawal request created: ₹${withdrawResponse.data.withdrawalRequest?.amount} (${withdrawResponse.data.withdrawalRequest?.status})`);
    withdrawalRequestId = withdrawResponse.data.withdrawalRequest.id;
  } else {
    console.log(`Error: ${withdrawResponse.data?.error || withdrawResponse.error}`);
  }
  console.log('');

  // Test POST withdrawal request - invalid amount (too low)
  console.log('3. Testing invalid amount (₹200 - below minimum)...');
  const invalidResponse = await makeRequest(`${BASE_URL}/api/user/withdrawal-requests`, {
    method: 'POST',
    body: JSON.stringify({
      withdrawalMethodId: paymentMethodId,
      amount: 200
    })
  });
  console.log(`Status: ${invalidResponse.status}, Success: ${invalidResponse.success}`);
  if (!invalidResponse.success) {
    console.log(`Expected error: ${invalidResponse.data?.error}`);
  }
  console.log('');

  // Test GET withdrawal requests again
  console.log('4. Getting withdrawal requests after creation...');
  const getResponse2 = await makeRequest(`${BASE_URL}/api/user/withdrawal-requests`);
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

async function testAdminApis(withdrawalRequestId) {
  console.log('👑 Testing Admin APIs...\n');

  if (!withdrawalRequestId) {
    console.log('❌ No withdrawal request available for testing admin APIs');
    return;
  }

  // Test GET admin withdrawal requests
  console.log('1. Getting admin withdrawal requests...');
  const adminGetResponse = await makeRequest(`${BASE_URL}/api/admin/withdrawal-requests`);
  console.log(`Status: ${adminGetResponse.status}, Success: ${adminGetResponse.success}`);
  if (adminGetResponse.success) {
    console.log(`Admin withdrawal requests count: ${adminGetResponse.data.withdrawalRequests?.length || 0}`);
    console.log(`Statistics:`, adminGetResponse.data.statistics);
  } else {
    console.log(`Error: ${adminGetResponse.data?.error || adminGetResponse.error}`);
  }
  console.log('');

  // Test GET specific withdrawal request
  console.log('2. Getting specific withdrawal request...');
  const specificResponse = await makeRequest(`${BASE_URL}/api/admin/withdrawal-requests/${withdrawalRequestId}`);
  console.log(`Status: ${specificResponse.status}, Success: ${specificResponse.success}`);
  if (specificResponse.success) {
    const request = specificResponse.data.withdrawalRequest;
    console.log(`Request: ₹${request.amount} (${request.status})`);
    console.log(`User: ${request.user?.email}`);
    console.log(`Method: ${request.withdrawalMethod?.type}`);
  } else {
    console.log(`Error: ${specificResponse.data?.error || specificResponse.error}`);
  }
  console.log('');

  // Test PUT approve withdrawal request
  console.log('3. Approving withdrawal request...');
  const approveResponse = await makeRequest(`${BASE_URL}/api/admin/withdrawal-requests/${withdrawalRequestId}`, {
    method: 'PUT',
    body: JSON.stringify({
      status: 'APPROVED',
      adminNotes: 'Test approval'
    })
  });
  console.log(`Status: ${approveResponse.status}, Success: ${approveResponse.success}`);
  if (approveResponse.success) {
    const request = approveResponse.data.withdrawalRequest;
    console.log(`Request approved: ₹${request.amount} (${request.status})`);
  } else {
    console.log(`Error: ${approveResponse.data?.error || approveResponse.error}`);
  }
  console.log('');
}

async function testWalletBalance() {
  console.log('💰 Testing Wallet API...\n');

  // Test GET wallet
  console.log('1. Getting wallet balance...');
  const walletResponse = await makeRequest(`${BASE_URL}/api/wallet`);
  console.log(`Status: ${walletResponse.status}, Success: ${walletResponse.success}`);
  if (walletResponse.success) {
    console.log(`Wallet Balance: ₹${walletResponse.data.wallet?.balance || 0}`);
    console.log(`Currency: ${walletResponse.data.wallet?.currency || 'INR'}`);
  } else {
    console.log(`Error: ${walletResponse.data?.error || walletResponse.error}`);
  }
  console.log('');
}

async function main() {
  console.log('🚀 Testing Withdrawal API Functionality\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  try {
    // Test wallet first
    await testWalletBalance();

    // Test payment methods
    const { bankAccountId, upiId } = await testPaymentMethods();

    // Test withdrawal requests
    const withdrawalRequestId = await testWithdrawalRequests(bankAccountId);

    // Test admin APIs
    await testAdminApis(withdrawalRequestId);

    console.log('✅ All API tests completed!');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

main();