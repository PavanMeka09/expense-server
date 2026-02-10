const express = require('express');
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middlewares/authMiddleware');
const authorizeMiddleware = require('../middlewares/authorizeMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

router.get('/:groupId/transactions', authorizeMiddleware('group:create'), expenseController.getTransactions);
router.post('/:groupId/expenses', authorizeMiddleware('group:create'), expenseController.create);
router.get('/:groupId/summary', authorizeMiddleware('group:create'), expenseController.getSummary);
router.post('/:groupId/settle', authorizeMiddleware('group:create'), expenseController.settleGroup);
router.get('/:groupId/audit', authorizeMiddleware('group:create'), expenseController.getAudit);

module.exports = router;
