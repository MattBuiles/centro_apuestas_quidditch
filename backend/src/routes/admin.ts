import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Admin endpoint - implement admin operations',
    timestamp: new Date().toISOString()
  });
});

export default router;
