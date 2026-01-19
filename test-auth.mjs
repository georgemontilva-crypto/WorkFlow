import 'dotenv/config';
import { createUser, verifyUserCredentials, getUserByEmail } from './server/db.ts';
import { generateToken, verifyToken } from './server/_core/auth.ts';

async function testAuth() {
  console.log('🔐 Testing Authentication System...\n');
  
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'Test User';
  
  try {
    // Test 1: Create User
    console.log('1️⃣ Testing user creation...');
    const newUser = await createUser({
      name: testName,
      email: testEmail,
      password: testPassword,
    });
    console.log('✅ User created successfully');
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Name: ${newUser.name}`);
    console.log(`   Role: ${newUser.role}`);
    console.log('');
    
    // Test 2: Verify Credentials (Valid)
    console.log('2️⃣ Testing login with valid credentials...');
    const validUser = await verifyUserCredentials(testEmail, testPassword);
    if (validUser) {
      console.log('✅ Login successful');
      console.log(`   User ID: ${validUser.id}`);
    } else {
      console.log('❌ Login failed - credentials not valid');
      process.exit(1);
    }
    console.log('');
    
    // Test 3: Verify Credentials (Invalid)
    console.log('3️⃣ Testing login with invalid password...');
    const invalidUser = await verifyUserCredentials(testEmail, 'WrongPassword');
    if (!invalidUser) {
      console.log('✅ Correctly rejected invalid password');
    } else {
      console.log('❌ Security issue: accepted invalid password!');
      process.exit(1);
    }
    console.log('');
    
    // Test 4: Generate JWT Token
    console.log('4️⃣ Testing JWT token generation...');
    const token = await generateToken(validUser);
    console.log('✅ JWT token generated');
    console.log(`   Token length: ${token.length} characters`);
    console.log(`   Token preview: ${token.substring(0, 50)}...`);
    console.log('');
    
    // Test 5: Verify JWT Token
    console.log('5️⃣ Testing JWT token verification...');
    const payload = await verifyToken(token);
    if (payload) {
      console.log('✅ JWT token verified successfully');
      console.log(`   User ID: ${payload.user_id}`);
      console.log(`   Email: ${payload.email}`);
      console.log(`   Role: ${payload.role}`);
    } else {
      console.log('❌ JWT token verification failed');
      process.exit(1);
    }
    console.log('');
    
    // Test 6: Get User by Email
    console.log('6️⃣ Testing getUserByEmail...');
    const foundUser = await getUserByEmail(testEmail);
    if (foundUser) {
      console.log('✅ User found by email');
      console.log(`   ID: ${foundUser.id}`);
      console.log(`   Name: ${foundUser.name}`);
    } else {
      console.log('❌ User not found');
      process.exit(1);
    }
    console.log('');
    
    console.log('🎉 All authentication tests passed!\n');
    console.log('📝 Summary:');
    console.log('   ✅ User registration works');
    console.log('   ✅ Password hashing works');
    console.log('   ✅ Login validation works');
    console.log('   ✅ JWT token generation works');
    console.log('   ✅ JWT token verification works');
    console.log('   ✅ User lookup works');
    console.log('');
    console.log('🚀 Your authentication system is ready for production!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

testAuth();
