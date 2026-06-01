const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates POST /auth/signup body.
 * Expects: { fullName, email, password }
 */
const validateSignup = (req, res, next) => {
  // Guard: body parser may not have run yet
  const body = req.body || {};
  const { fullName, email, password } = body;

  if (!fullName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'fullName, email, and password are all required'
    });
  }

  if (typeof fullName !== 'string' || fullName.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Full name must be at least 2 characters'
    });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters'
    });
  }

  // Normalise before passing to controller
  req.body.fullName = fullName.trim();
  req.body.email = email.toLowerCase().trim();

  next();
};

/**
 * Validates POST /auth/login body.
 * Expects: { email, password }
 */
const validateLogin = (req, res, next) => {
  const body = req.body || {};
  const { email, password } = body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }

  req.body.email = email.toLowerCase().trim();

  next();
};

module.exports = { validateSignup, validateLogin };
