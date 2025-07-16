import { Router, Response } from 'express';
import { Database } from '../database/Database';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const db = Database.getInstance();

// Validation middleware
const validateTransaction = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('description').optional().isString().trim().isLength({ max: 255 })
];

// GET /api/transactions - Get user transactions
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const transactions = await db.getUserTransactions(user.userId, limit);
    
    return res.json({
      success: true,
      data: transactions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/transactions/deposit - Make a deposit
router.post('/deposit', authenticate, validateTransaction, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        data: errors.array(),
        timestamp: new Date().toISOString()
      });
    }

    const user = req.user!;
    const { amount, description } = req.body;
    
    // Get current user data
    const currentUser = await db.getUserById(user.userId) as any;
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    const newBalance = currentUser.balance + amount;
    
    // Update user balance
    await db.updateUserBalance(user.userId, newBalance);

    // Get current virtual time
    let virtualTime: string;
    try {
      const { VirtualTimeService } = await import('../services/VirtualTimeService');
      const virtualTimeService = VirtualTimeService.getInstance();
      await virtualTimeService.initialize();
      const currentState = await virtualTimeService.getCurrentState();
      virtualTime = currentState.currentDate.toISOString();
    } catch (error) {
      console.error('Error getting virtual time for transaction, using real time:', error);
      virtualTime = new Date().toISOString();
    }

    // Create transaction record with virtual time
    const transactionId = uuidv4();
    const transactionData = {
      id: transactionId,
      userId: user.userId,
      type: 'deposit',
      amount: amount,
      balanceBefore: currentUser.balance,
      balanceAfter: newBalance,
      description: description || `Depósito de ${amount} galeones`,
      referenceId: undefined
    };
    
    await db.createTransaction(transactionData);

    return res.json({
      success: true,
      data: {
        transactionId,
        amount,
        balanceBefore: currentUser.balance,
        balanceAfter: newBalance,
        virtualTime
      },
      message: 'Depósito realizado exitosamente',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing deposit:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/transactions/withdraw - Make a withdrawal
router.post('/withdraw', authenticate, validateTransaction, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        data: errors.array(),
        timestamp: new Date().toISOString()
      });
    }

    const user = req.user!;
    const { amount, description } = req.body;
    
    // Get current user data
    const currentUser = await db.getUserById(user.userId) as any;
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    const newBalance = currentUser.balance - amount;
    
    // Check if user has sufficient balance
    if (newBalance < 0) {
      return res.status(400).json({
        success: false,
        error: 'Saldo insuficiente',
        timestamp: new Date().toISOString()
      });
    }
    
    // Update user balance
    await db.updateUserBalance(user.userId, newBalance);

    // Get current virtual time
    let virtualTime: string;
    try {
      const { VirtualTimeService } = await import('../services/VirtualTimeService');
      const virtualTimeService = VirtualTimeService.getInstance();
      await virtualTimeService.initialize();
      const currentState = await virtualTimeService.getCurrentState();
      virtualTime = currentState.currentDate.toISOString();
    } catch (error) {
      console.error('Error getting virtual time for transaction, using real time:', error);
      virtualTime = new Date().toISOString();
    }

    // Create transaction record with virtual time
    const transactionId = uuidv4();
    const transactionData = {
      id: transactionId,
      userId: user.userId,
      type: 'withdrawal',
      amount: -amount, // Negative for withdrawals
      balanceBefore: currentUser.balance,
      balanceAfter: newBalance,
      description: description || `Retiro de ${amount} galeones`,
      referenceId: undefined
    };
    
    await db.createTransaction(transactionData);

    return res.json({
      success: true,
      data: {
        transactionId,
        amount,
        balanceBefore: currentUser.balance,
        balanceAfter: newBalance,
        virtualTime
      },
      message: 'Retiro realizado exitosamente',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
