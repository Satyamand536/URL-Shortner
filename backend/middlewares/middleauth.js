require("dotenv").config();
const { validateToken } = require("../service/auth");
const User = require("../models/user");

function checkForAuthentication(req, res, next) {
  req.user = null;
  const token = req.cookies?.token;
  if (!token) return next();

  try {
    const payload = validateToken(token);
    req.user = payload;
  } catch (err) {
    // Invalid / expired token — proceed unauthenticated
    res.clearCookie("token");
  }
  return next();
}

function restrictTo(roles = []) {
  return function (req, res, next) {
    if (!req.user)
      return res.status(401).json({ error: "Unauthorized: Please sign in" });

    if (!roles.includes(req.user.role))
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });

    return next();
  };
}

module.exports = { checkForAuthentication, restrictTo };