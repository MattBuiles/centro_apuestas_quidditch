import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const adminController = new AdminController();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// POST /api/admin/reset-database - Complete database reset
router.post('/reset-database', adminController.resetDatabase);

// GET /api/admin/system-status - Get system status
router.get('/system-status', adminController.getSystemStatus);

// DELETE /api/admin/truncate/:table - Truncate specific table
router.delete('/truncate/:table', adminController.truncateTable);

// POST /api/admin/generate-season - Generate new season
router.post('/generate-season', adminController.generateNewSeason);

// GET /api/admin/logs - Get admin logs
router.get('/logs', adminController.getAdminLogs);

export default router;
