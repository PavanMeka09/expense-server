const express = require('express');
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middlewares/authMiddleware');
const authorizeMiddleware = require('../middlewares/authorizeMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

router.post('/create', authorizeMiddleware('group:create'), groupController.create);
router.put('/update', authorizeMiddleware('group:create'), groupController.update);
router.patch('/members/add', authorizeMiddleware('group:create'), groupController.addMembers);
router.patch('/members/remove', authorizeMiddleware('group:create'), groupController.removeMembers);
router.get('/my-groups', authorizeMiddleware('group:create'), groupController.getGroupsByUser);
router.get('/status', authorizeMiddleware('group:create'), groupController.getGroupsByPaymentStatus);
router.get('/:groupId/details', authorizeMiddleware('group:create'), groupController.getGroupDetails);
router.get('/:groupId/transactions', authorizeMiddleware('group:create'), groupController.getGroupTransactions);
router.get('/:groupId/audit', authorizeMiddleware('group:create'), groupController.getAudit);

module.exports = router;
