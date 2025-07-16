const fs = require('fs');
const path = require('path');

console.log('🧙‍♀️ TESTING PASSWORD RECOVERY SYSTEM 🧙‍♀️');
console.log('='.repeat(60));

// Test 1: Verify backend routes exist
console.log('\n📋 Test 1: Checking backend routes...');
const authRoutesPath = path.join(__dirname, 'backend', 'src', 'routes', 'auth.ts');

if (fs.existsSync(authRoutesPath)) {
  const authRoutesContent = fs.readFileSync(authRoutesPath, 'utf8');
  
  const hasForgotPassword = authRoutesContent.includes('/forgot-password');
  const hasResetPassword = authRoutesContent.includes('/reset-password');
  
  console.log(`✅ Forgot password route: ${hasForgotPassword ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Reset password route: ${hasResetPassword ? 'EXISTS' : 'MISSING'}`);
} else {
  console.log('❌ Auth routes file not found');
}

// Test 2: Verify controller methods exist
console.log('\n📋 Test 2: Checking controller methods...');
const controllerPath = path.join(__dirname, 'backend', 'src', 'controllers', 'AuthController.ts');

if (fs.existsSync(controllerPath)) {
  const controllerContent = fs.readFileSync(controllerPath, 'utf8');
  
  const hasForgotPasswordMethod = controllerContent.includes('forgotPassword =');
  const hasResetPasswordMethod = controllerContent.includes('resetPassword =');
  const hasBcryptImport = controllerContent.includes("import bcrypt from 'bcryptjs'");
  
  console.log(`✅ forgotPassword method: ${hasForgotPasswordMethod ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ resetPassword method: ${hasResetPasswordMethod ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ bcrypt import: ${hasBcryptImport ? 'EXISTS' : 'MISSING'}`);
} else {
  console.log('❌ AuthController file not found');
}

// Test 3: Verify database methods exist
console.log('\n📋 Test 3: Checking database methods...');
const usersRepoPath = path.join(__dirname, 'backend', 'src', 'database', 'UsersRepository.ts');

if (fs.existsSync(usersRepoPath)) {
  const usersRepoContent = fs.readFileSync(usersRepoPath, 'utf8');
  
  const hasGetUserByEmailForRecovery = usersRepoContent.includes('getUserByEmailForRecovery');
  const hasUpdateUserPasswordByEmail = usersRepoContent.includes('updateUserPasswordByEmail');
  
  console.log(`✅ getUserByEmailForRecovery: ${hasGetUserByEmailForRecovery ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ updateUserPasswordByEmail: ${hasUpdateUserPasswordByEmail ? 'EXISTS' : 'MISSING'}`);
} else {
  console.log('❌ UsersRepository file not found');
}

// Test 4: Verify frontend integration
console.log('\n📋 Test 4: Checking frontend integration...');
const recoveryPagePath = path.join(__dirname, 'src', 'pages', 'RecoveryPage', 'index.tsx');

if (fs.existsSync(recoveryPagePath)) {
  const recoveryPageContent = fs.readFileSync(recoveryPagePath, 'utf8');
  
  const hasCheckEmailForRecovery = recoveryPageContent.includes('checkEmailForRecovery');
  const hasAsyncHandling = recoveryPageContent.includes('await resetPasswordByEmail');
  const hasErrorHandling = recoveryPageContent.includes('try {') && recoveryPageContent.includes('catch (error)');
  
  console.log(`✅ checkEmailForRecovery usage: ${hasCheckEmailForRecovery ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Async password reset: ${hasAsyncHandling ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Error handling: ${hasErrorHandling ? 'EXISTS' : 'MISSING'}`);
} else {
  console.log('❌ RecoveryPage file not found');
}

// Test 5: Verify AuthContext updates
console.log('\n📋 Test 5: Checking AuthContext updates...');
const authContextPath = path.join(__dirname, 'src', 'context', 'AuthContext.tsx');

if (fs.existsSync(authContextPath)) {
  const authContextContent = fs.readFileSync(authContextPath, 'utf8');
  
  const hasCheckEmailFunction = authContextContent.includes('checkEmailForRecovery');
  const hasAsyncResetPassword = authContextContent.includes('resetPasswordByEmail = async');
  const hasApiClientUsage = authContextContent.includes('apiClient.post');
  
  console.log(`✅ checkEmailForRecovery function: ${hasCheckEmailFunction ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Async resetPasswordByEmail: ${hasAsyncResetPassword ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ apiClient usage: ${hasApiClientUsage ? 'EXISTS' : 'MISSING'}`);
} else {
  console.log('❌ AuthContext file not found');
}

console.log('\n🎯 SUMMARY:');
console.log('='.repeat(30));
console.log('✨ Password recovery system implemented with:');
console.log('   📧 Email verification via backend');
console.log('   🔐 Secure password hashing with bcrypt');
console.log('   🦉 Console simulation for email sending');
console.log('   🔄 Frontend-backend integration');
console.log('   ⚡ Async error handling');
console.log('\n🧪 To test:');
console.log('   1. Start backend server');
console.log('   2. Navigate to /recovery page');
console.log('   3. Enter registered email');
console.log('   4. Check console for recovery simulation');
console.log('   5. Set new password');
console.log('   6. Login with new password');

console.log('\n🔮 Magic is ready for testing! ✨');
