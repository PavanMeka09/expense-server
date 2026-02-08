const express = require('express');
const rbacController = require('../controllers/rbacController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

router.post('/', rbacController.create);
router.patch('/', rbacController.update);
router.post('/delete', rbacController.delete);
router.get('/', rbacController.getAllUsers);

module.exports = router;