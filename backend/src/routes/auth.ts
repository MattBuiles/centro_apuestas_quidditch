import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateRequest } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { authRateLimit, profileRateLimit, refreshRateLimit } from '../middleware/rateLimiter';
import { profileCache } from '../middleware/cache';
import { body } from 'express-validator';

const router = Router();
const authController = new AuthController();

// Validation rules
const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
];

const registerValidation = [
  body('username').isLength({ min: 3, max: 20 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').optional().isIn(['user', 'admin'])
];

const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail()
];

const resetPasswordValidation = [
  body('email').isEmail().normalizeEmail(),
  body('newPassword').isLength({ min: 6 })
];

// Routes
router.post('/login', authRateLimit, loginValidation, validateRequest, authController.login);
router.post('/register', authRateLimit, registerValidation, validateRequest, authController.register);
router.post('/refresh', refreshRateLimit, authController.refreshToken);
router.get('/me', profileRateLimit, authenticate, profileCache, authController.getProfile);
router.post('/forgot-password', authRateLimit, forgotPasswordValidation, validateRequest, authController.forgotPassword);
router.post('/check-email', authRateLimit, forgotPasswordValidation, validateRequest, authController.checkEmailExists);
router.post('/reset-password', authRateLimit, resetPasswordValidation, validateRequest, authController.resetPassword);

export default router;
