require("dotenv").config();
const JWT = require("jsonwebtoken");

const secret = process.env.JWT_SECRET || "fallback_dev_secret_never_use_in_prod";

// -----------------------------------------------
// Create signed JWT – NEVER expose this to client
// in response body. Set only via httpOnly cookie.
// -----------------------------------------------
function createTokenForUser(user) {
  const payload = {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
  };
  return JWT.sign(payload, secret, { expiresIn: "7d" });
}

// -----------------------------------------------
// Validate JWT – throws if invalid or expired
// -----------------------------------------------
function validateToken(token) {
  return JWT.verify(token, secret);
}

module.exports = { createTokenForUser, validateToken };