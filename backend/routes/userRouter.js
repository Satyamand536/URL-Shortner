require("dotenv").config();
const express = require("express");
const router = express.Router();
const { createDecipheriv } = require("crypto");
const User = require("../models/user");
const { validateToken } = require("../service/auth");

// -----------------------------------------------------------
// AES-256-GCM DECRYPTION HELPER
// Decrypts password ciphertext sent from the React frontend
// -----------------------------------------------------------
function decryptPassword(encryptedPayload) {
  try {
    const key = Buffer.from(process.env.ENCRYPTION_KEY, "utf8"); // 32 bytes
    const { iv, data, tag } = encryptedPayload;

    const ivBuffer = Buffer.from(iv, "base64");
    const tagBuffer = Buffer.from(tag, "base64");
    const dataBuffer = Buffer.from(data, "base64");

    const decipher = createDecipheriv("aes-256-gcm", key, ivBuffer);
    decipher.setAuthTag(tagBuffer);

    const decrypted = Buffer.concat([
      decipher.update(dataBuffer),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch (err) {
    throw new Error("Decryption failed");
  }
}

// -----------------------------------------------------------
// VALIDATION PATTERNS
// -----------------------------------------------------------
const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Cookie options — SECURE by default
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// -----------------------------------------------------------
// CHECK EMAIL (real-time availability check)
// -----------------------------------------------------------
router.get("/check-email", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email required" });
    if (!emailRegex.test(email))
      return res.status(400).json({ error: "Invalid email format" });

    const user = await User.findOne({ email: email.toLowerCase() });
    return res.json({ available: !user });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// -----------------------------------------------------------
// SIGNUP
// -----------------------------------------------------------
router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, encryptedPassword } = req.body;

    if (!fullName || !email || !encryptedPassword)
      return res.status(400).json({ error: "All fields required" });

    if (fullName.trim().length < 3)
      return res.status(400).json({ error: "Full name must be at least 3 characters" });

    if (!emailRegex.test(email))
      return res.status(400).json({ error: "Invalid email format" });

    // Decrypt password from AES-GCM ciphertext
    let password;
    try {
      password = decryptPassword(encryptedPassword);
    } catch {
      return res.status(400).json({ error: "Invalid encrypted payload" });
    }

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error: "Password must be 8+ chars with uppercase, lowercase, number & special char",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    await User.create({ fullName: fullName.trim(), email: normalizedEmail, password });

    return res.status(201).json({ message: "Account created successfully" });
  } catch (err) {
    console.error("Signup error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
});

// -----------------------------------------------------------
// SIGNIN
// -----------------------------------------------------------
router.post("/signin", async (req, res) => {
  try {
    const { email, encryptedPassword } = req.body;

    if (!email || !encryptedPassword)
      return res.status(400).json({ error: "Email and password required" });

    // Decrypt password
    let password;
    try {
      password = decryptPassword(encryptedPassword);
    } catch {
      return res.status(400).json({ error: "Invalid encrypted payload" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // matchPasswordAndGenerateToken — returns JWT string
    let token;
    try {
      token = await User.matchPasswordAndGenerateToken(normalizedEmail, password);
    } catch (err) {
      if (err.message === "User not found!") {
        return res.status(404).json({ error: "No account found with this email" });
      }
      if (err.message === "Incorrect password") {
        return res.status(401).json({ error: "Incorrect password" });
      }
      throw err;
    }

    // Token goes into httpOnly cookie — NEVER in response body
    res.cookie("token", token, cookieOptions);

    // Fetch safe user data for the response
    const user = await User.findOne({ email: normalizedEmail }).select(
      "fullName email role createdAt"
    );

    return res.json({
      message: "Signed in successfully",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Signin error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// -----------------------------------------------------------
// CHECK LOGIN STATUS (used on page load)
// -----------------------------------------------------------
router.get("/check-login", async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.json({ loggedIn: false });

    const decoded = validateToken(token);
    const user = await User.findById(decoded._id).select("fullName email role");
    if (!user) return res.json({ loggedIn: false });

    return res.json({
      loggedIn: true,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch {
    res.clearCookie("token");
    return res.json({ loggedIn: false });
  }
});

// -----------------------------------------------------------
// LOGOUT
// -----------------------------------------------------------
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ message: "Logged out successfully" });
});

module.exports = router;