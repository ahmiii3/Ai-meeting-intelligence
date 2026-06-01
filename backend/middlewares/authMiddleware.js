const jwt = require('jsonwebtoken');

/**
 * Protects routes by verifying the JWT access token.
 *
 * Expects:  Authorization: Bearer <accessToken>
 * Attaches: req.user = { userId, email, role, iat, exp }
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;

    next();
  } catch (error) {
    // Distinguish between expired and otherwise invalid tokens
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token has expired. Please refresh your token.'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid access token.'
    });
  }
};

module.exports = authMiddleware;
