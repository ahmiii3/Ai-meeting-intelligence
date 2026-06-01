const express = require('express');
const router = express.Router();

const { signup, login, refreshToken, logout } = require('../controllers/authController');
const { validateSignup, validateLogin } = require('../middlewares/validationMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');

// Ensure body is always parsed for every route in this router
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// POST /api/auth/signup  — create a new account
router.post('/signup', validateSignup, signup);

// POST /api/auth/login   — authenticate and receive tokens
router.post('/login', validateLogin, login);

// POST /api/auth/refresh-token  — get a new access token
router.post('/refresh-token', refreshToken);

// POST /api/auth/logout  — invalidate refresh token (protected)
router.post('/logout', authMiddleware, logout);

module.exports = router;
