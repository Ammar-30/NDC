function scopeBranch(req, res, next) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthenticated' });

  if (user.role === 'staff') {
    req.scope = { type: 'branch', branchId: user.branchId };
  } else if (user.role === 'owner') {
    req.scope = { type: 'owner', ownerId: user.ownerId };
  } else {
    return res.status(403).json({ error: 'Unknown role' });
  }

  next();
}

function requireOwner(req, res, next) {
  if (!req.user || req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Owner access required' });
  }
  next();
}

module.exports = { scopeBranch, requireOwner };
