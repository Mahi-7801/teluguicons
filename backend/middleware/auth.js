const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role) {
    return next();
  }
  return res.status(403).json({ message: 'Admin access required' });
};

module.exports = { authenticate, authorizeAdmin };