const express = require('express');
const authController = require('../controllers/authController');
const { loginValidators } = require('../validators/authValidators');

const router = express.Router();

router.post('/login', loginValidators, authController.login);
router.post('/register', authController.register);
router.post('/is-user-logged-in', authController.isUserLoggedIn);
router.post('/logout', authController.logout);
router.post('/google-auth', authController.googleSso);

module.exports = router;