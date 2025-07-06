import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Bets endpoint - implement CRUD operations',
    timestamp: new Date().toISOString()
  });
});

export default router;
