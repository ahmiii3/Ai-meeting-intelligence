const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Token Helpers ────────────────────────────────────────────────────────────

/**
 * Generate a short-lived access token (default 15m).
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m'
  });
};

/**
 * Generate a long-lived refresh token (default 7d).
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d'
  });
};

/**
 * Strip sensitive fields before sending user data to the client.
 */
const sanitizeUser = (user) => {
  const { password, refresh_token, ...safe } = user.get({ plain: true });
  return safe;
};

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /auth/signup
 * Body: { fullName, email, password }
 */
const signup = async (req, res) => {
  try {
    const { fullName, email } = req.body;
    // Coerce to string — JSON numbers would cause bcrypt to throw
    const password = String(req.body.password);

    // Check for duplicate email
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user (role defaults to 'owner')
    const user = await User.create({
      full_name: fullName,
      email,
      password: hashedPassword
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { user: sanitizeUser(user) }
    });
  } catch (error) {
    console.error('Signup error:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error during signup'
    });
  }
};

/**
 * POST /auth/login
 * Body: { email, password }
 */
const login = async (req, res) => {
  try {
    const { email } = req.body;
    const password = String(req.body.password);

    // Find user (include password for comparison)
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Build token payload
    const tokenPayload = { userId: user.id, email: user.email };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshTokenValue = generateRefreshToken({ userId: user.id });

    // Persist refresh token in DB
    await user.update({ refresh_token: refreshTokenValue });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: sanitizeUser(user),
        accessToken,
        refreshToken: refreshTokenValue
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

/**
 * POST /auth/refresh-token
 * Body: { refreshToken }
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify the refresh token signature & expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Make sure the token matches what is stored in the DB
    const user = await User.findOne({
      where: { id: decoded.userId, refresh_token: token }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not recognised'
      });
    }

    // Issue a new access token
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email
    });

    return res.status(200).json({
      success: true,
      message: 'Access token refreshed',
      data: { accessToken: newAccessToken }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during token refresh'
    });
  }
};

/**
 * POST /auth/logout
 * Requires: Bearer access token (via authMiddleware)
 */
const logout = async (req, res) => {
  try {
    // req.user is attached by authMiddleware
    await User.update(
      { refresh_token: null },
      { where: { id: req.user.userId } }
    );

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

module.exports = { signup, login, refreshToken, logout };
