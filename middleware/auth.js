const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Get token from header
  const authHeader = req.header('Authorization');
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({ success: false, message: 'No authentication token provided, authorization denied' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_ai_image_toolkit_jwt_key_2026';
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded.user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token is invalid or expired' });
  }
};

module.exports = authMiddleware;
