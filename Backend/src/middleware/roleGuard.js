// Role-based access control middleware (REQ-36/REQ-37). Must run after requireAuth,
// which is what populates req.user.

function roleGuard(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }
    next();
  };
}

module.exports = { roleGuard };
