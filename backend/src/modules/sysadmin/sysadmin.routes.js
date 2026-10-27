const express = require('express');
const router = express.Router();
const {
  getSystemStatus, getSystemLogs,
  getConfigs, updateConfigs, testSmtp, testAiService,
  getUsers, createUser, updateUser, resetUserPassword,
  toggleUserStatus, setUserRole
} = require('./sysadmin.controller');
const { authenticate, authorizeSysAdmin } = require('../../middleware/auth.middleware');

router.use(authenticate, authorizeSysAdmin);

// Monitoring
router.get('/monitoring/status', getSystemStatus);
router.get('/monitoring/logs', getSystemLogs);

// Konfigurasi layanan eksternal
router.get('/config', getConfigs);
router.put('/config', updateConfigs);
router.post('/config/test-smtp', testSmtp);
router.post('/config/test-ai', testAiService);

// Manajemen user
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.put('/users/:id/reset-password', resetUserPassword);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.put('/users/:id/set-role', setUserRole);

module.exports = router;