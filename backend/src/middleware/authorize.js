/**
 * Middleware factory: check if the authenticated admin has a required permission.
 * Must be used AFTER authenticate middleware.
 *
 * Usage:
 *   router.post('/loans/:id/approve', authenticate, authorize('DECIDE_LOANS'), controller)
 */
const authorize = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const { permissions } = req.admin;

    if (!permissions || !permissions.includes(requiredPermission)) {
      return res.status(403).json({
        error: `Forbidden. Required permission: ${requiredPermission}`,
      });
    }

    next();
  };
};

module.exports = authorize;
