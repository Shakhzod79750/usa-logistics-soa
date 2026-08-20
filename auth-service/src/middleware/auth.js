const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');

function authenticate(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Missing or malformed Authorization header'));
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { sub, email, role, full_name }
    next();
  } catch (err) {
    next(new ApiError(401, 'Invalid or expired token'));
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Not authenticated'));
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, `Role '${req.user.role}' is not permitted for this action`));
    }
    next();
  };
}

module.exports = { authenticate, authorize };
