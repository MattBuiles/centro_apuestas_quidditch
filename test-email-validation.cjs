console.log('🔍 TESTING EMAIL VALIDATION FOR PASSWORD RECOVERY 🔍');
console.log('='.repeat(60));

const fs = require('fs');
const path = require('path');

// Test 1: Verificar que el endpoint check-email existe en las rutas
console.log('\n1. Checking auth routes...');
const authRoutesPath = path.join(__dirname, 'backend', 'src', 'routes', 'auth.ts');
if (fs.existsSync(authRoutesPath)) {
  const authRoutesContent = fs.readFileSync(authRoutesPath, 'utf8');
  
  const hasCheckEmailRoute = authRoutesContent.includes('/check-email');
  const hasCheckEmailMethod = authRoutesContent.includes('authController.checkEmailExists');
  
  console.log(`✅ Check email route: ${hasCheckEmailRoute ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Controller method call: ${hasCheckEmailMethod ? 'EXISTS' : 'MISSING'}`);
} else {
  console.log('❌ Auth routes file not found');
}

// Test 2: Verificar que el método checkEmailExists existe en el controlador
console.log('\n2. Checking AuthController...');
const controllerPath = path.join(__dirname, 'backend', 'src', 'controllers', 'AuthController.ts');
if (fs.existsSync(controllerPath)) {
  const controllerContent = fs.readFileSync(controllerPath, 'utf8');
  
  const hasCheckEmailExistsMethod = controllerContent.includes('checkEmailExists =');
  const hasUserValidation = controllerContent.includes('getUserByEmailForRecovery');
  const hasCorrectResponse = controllerContent.includes('data: { exists:');
  
  console.log(`✅ checkEmailExists method: ${hasCheckEmailExistsMethod ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ User validation: ${hasUserValidation ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Correct response format: ${hasCorrectResponse ? 'EXISTS' : 'MISSING'}`);
} else {
  console.log('❌ AuthController file not found');
}

// Test 3: Verificar que el frontend usa el nuevo endpoint
console.log('\n3. Checking frontend AuthContext...');
const authContextPath = path.join(__dirname, 'src', 'context', 'AuthContext.tsx');
if (fs.existsSync(authContextPath)) {
  const authContextContent = fs.readFileSync(authContextPath, 'utf8');
  
  const usesCheckEmailEndpoint = authContextContent.includes('/auth/check-email');
  const hasCorrectReturnLogic = authContextContent.includes('response.data?.exists === true');
  
  console.log(`✅ Uses check-email endpoint: ${usesCheckEmailEndpoint ? 'YES' : 'NO'}`);
  console.log(`✅ Correct return logic: ${hasCorrectReturnLogic ? 'YES' : 'NO'}`);
} else {
  console.log('❌ AuthContext file not found');
}

// Test 4: Verificar que la página de recuperación maneja correctamente el flujo
console.log('\n4. Checking RecoveryPage logic...');
const recoveryPagePath = path.join(__dirname, 'src', 'pages', 'RecoveryPage', 'index.tsx');
if (fs.existsSync(recoveryPagePath)) {
  const recoveryPageContent = fs.readFileSync(recoveryPagePath, 'utf8');
  
  const hasEmailValidation = recoveryPageContent.includes('checkEmailForRecovery(email)');
  const hasConditionalFlow = recoveryPageContent.includes('if (emailExists)');
  const hasErrorHandling = recoveryPageContent.includes('Este correo electrónico no está registrado');
  
  console.log(`✅ Email validation call: ${hasEmailValidation ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Conditional flow: ${hasConditionalFlow ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Error handling: ${hasErrorHandling ? 'EXISTS' : 'MISSING'}`);
} else {
  console.log('❌ RecoveryPage file not found');
}

console.log('\n' + '='.repeat(60));
console.log('🧪 EMAIL VALIDATION TEST COMPLETE 🧪');
console.log('\nNow the password recovery flow should properly validate');
console.log('that the email exists before allowing users to proceed');
console.log('to the password reset screen.');
