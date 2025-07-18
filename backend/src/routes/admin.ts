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

// POST /api/admin/create-season - Create new season with proper season management
router.post('/create-season', adminController.createNewSeason);

// GET /api/admin/logs - Get admin logs
router.get('/logs', adminController.getAdminLogs);

// GET /api/admin/dashboard/stats - Get dashboard statistics
router.get('/dashboard/stats', adminController.getDashboardStats);

// GET /api/admin/dashboard/bets-by-day - Get bets grouped by day of week
router.get('/dashboard/bets-by-day', adminController.getBetsByDay);

// GET /api/admin/dashboard/popular-teams - Get most popular teams by bet count
router.get('/dashboard/popular-teams', adminController.getPopularTeams);

// GET /api/admin/dashboard/risk-analysis - Get risk analysis data
router.get('/dashboard/risk-analysis', adminController.getRiskAnalysis);

// GET /api/admin/dashboard/active-users - Get most active users
router.get('/dashboard/active-users', adminController.getActiveUsers);

// GET /api/admin/dashboard/performance-metrics - Get platform performance metrics
router.get('/dashboard/performance-metrics', adminController.getPerformanceMetrics);

// GET /api/admin/dashboard/recent-activity - Get recent platform activity
router.get('/dashboard/recent-activity', adminController.getRecentActivity);

// GET /api/admin/dashboard/risk-alerts - Get current risk alerts
router.get('/dashboard/risk-alerts', adminController.getRiskAlerts);

// GET /api/admin/statistics/advanced - Get advanced statistics with filters
router.get('/statistics/advanced', adminController.getAdvancedStatistics);

// GET /api/admin/users/list - Get users list for filters
router.get('/users/list', adminController.getUsersList);

export default router;
