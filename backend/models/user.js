const mongoose = require("mongoose");
const { createHmac, randomBytes } = require("crypto");
const { createTokenForUser } = require("../service/auth");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      minlength: 3,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["NORMAL", "ADMIN"],
      default: "NORMAL",
    },
    salt: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// -----------------------------------------
// PRE-SAVE: Hash password using HMAC-SHA256
// -----------------------------------------
userSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();

  const salt = randomBytes(16).toString("hex");
  const hashedPassword = createHmac("sha256", salt)
    .update(this.password)
    .digest("hex");

  this.salt = salt;
  this.password = hashedPassword;
  return next();
});

// -----------------------------------------
// STATIC: Match password and generate token
// -----------------------------------------
userSchema.statics.matchPasswordAndGenerateToken = async function (email, password) {
  const user = await this.findOne({ email });
  if (!user) throw new Error("User not found!");

  const hashedPassword = createHmac("sha256", user.salt)
    .update(password)
    .digest("hex");

  if (hashedPassword !== user.password) throw new Error("Incorrect password");

  // Return token — caller will set it in httpOnly cookie
  return createTokenForUser(user);
};

const User = mongoose.model("user", userSchema);
module.exports = User;