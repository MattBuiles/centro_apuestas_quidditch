import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateRequest } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
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
  body('password').isLength({ min: 6 })
];

// Routes
router.post('/login', loginValidation, validateRequest, authController.login);
router.post('/register', registerValidation, validateRequest, authController.register);
router.post('/refresh', authController.refreshToken);
router.get('/me', authenticate, authController.getProfile);

export default router;
