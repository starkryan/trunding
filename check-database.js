const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Checking PostgreSQL database connection and state...\n');

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Check tables exist
    console.log('📊 Checking withdrawal-related tables:');

    const userCount = await prisma.user.count();
    console.log(`- Users: ${userCount}`);

    const walletCount = await prisma.wallet.count();
    console.log(`- Wallets: ${walletCount}`);

    const withdrawalMethodCount = await prisma.withdrawalMethod.count();
    console.log(`- Withdrawal Methods: ${withdrawalMethodCount}`);

    const withdrawalRequestCount = await prisma.withdrawalRequest.count();
    console.log(`- Withdrawal Requests: ${withdrawalRequestCount}`);

    const transactionCount = await prisma.transaction.count();
    console.log(`- Transactions: ${transactionCount}`);

    console.log('\n📝 Checking sample data:');

    // Get a sample user if exists
    const sampleUser = await prisma.user.findFirst({
      include: {
        wallet: true,
        withdrawalMethods: true,
        withdrawalRequests: {
          include: {
            withdrawalMethod: true
          }
        }
      }
    });

    if (sampleUser) {
      console.log(`- Sample User: ${sampleUser.email} (Role: ${sampleUser.role})`);
      console.log(`  Wallet Balance: ₹${sampleUser.wallet?.balance || 0}`);
      console.log(`  Payment Methods: ${sampleUser.withdrawalMethods.length}`);
      console.log(`  Withdrawal Requests: ${sampleUser.withdrawalRequests.length}`);

      if (sampleUser.withdrawalMethods.length > 0) {
        console.log('\n💳 Payment Methods:');
        sampleUser.withdrawalMethods.forEach(method => {
          console.log(`  - ${method.type}: ${method.type === 'BANK_ACCOUNT' ? method.bankName : method.upiId} (${method.isDefault ? 'Default' : 'Not default'})`);
        });
      }

      if (sampleUser.withdrawalRequests.length > 0) {
        console.log('\n📋 Withdrawal Requests:');
        sampleUser.withdrawalRequests.forEach(request => {
          console.log(`  - ₹${request.amount} to ${request.withdrawalMethod.type} (${request.status})`);
        });
      }
    } else {
      console.log('- No users found in database');
    }

    console.log('\n🎯 Database check completed successfully!');

  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();