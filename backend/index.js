require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { connecttoMongodb } = require("./connect");
const { checkForAuthentication, restrictTo } = require("./middlewares/middleauth");
const errorMiddleware = require("./middlewares/errorMiddleware");

const urlRouter = require("./routes/urlRouter");
const userRouter = require("./routes/userRouter");

const ShortURL = require("./models/url");  // renamed: avoids shadowing global URL constructor

const app = express();
const PORT = process.env.PORT || 8001;

// ─── Database ────────────────────────────────────────────────
connecttoMongodb(process.env.MONGODB_URI || "mongodb://localhost:27017/short-url")
    .then(() => console.log("✅  [DB] MongoDB connected"))
    .catch((err) => console.error("❌  [DB] Connection error:", err));

// ─── Security & Logging ───────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        contentSecurityPolicy: false,
    })
);

// ─── CORS ─────────────────────────────────────────────────────
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// ─── Rate Limiting ────────────────────────────────────────────
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50, // More generous for dev
    message: { error: "Too many attempts. Protect your account - try again later." },
});

// ─── Core Middleware ──────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));
app.use(cookieParser());
app.use(checkForAuthentication);

// ─── API Routes ───────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ status: "Pro", uptime: process.uptime() }));
app.post("/api/debug/log-error", (req, res) => {
    console.error("🛑  [FRONTEND ERROR]:", req.body);
    res.sendStatus(200);
});
app.use("/api/user", authLimiter, userRouter);
app.use("/api/url", restrictTo(["NORMAL", "ADMIN"]), urlRouter);

// ─── Short URL Redirect System ────────────────────────────────
app.get("/s/:shortId", async (req, res) => {
    const entry = await ShortURL.findOneAndUpdate(
        { shortId: req.params.shortId },
        {
            $push: {
                visitHistory: { 
                    timestamp: Date.now(),
                    // Pro Telemetry: Simulated visitor data
                    userAgent: req.headers["user-agent"],
                    ip: req.ip || "127.0.0.1"
                },
            },
        },
        { new: true }
    );
    if (!entry) return res.status(404).json({ error: "Short URL not found" });

    // In production (Render), FRONTEND_URL and BACKEND_URL are usually the same.
    // If not set, we use the current request host to stay dynamic.
    const protocol = req.protocol;
    const host = req.get("host");
    const domain = process.env.FRONTEND_URL || `${protocol}://${host}`;
    
    const previewURL = `${domain}/preview?url=${encodeURIComponent(entry.redirectURL)}&id=${entry.shortId}`;
    return res.redirect(previewURL);
});

// ─── Serve Frontend (Partial Monorepo Support) ────────────────
// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// Handle React routing, return all requests to React app
// Exclude /api routes so they fall through to error handling if not matched
app.get(/(.*)/, (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// ─── Global Error Handling (After Routes) ─────────────────────
app.use(errorMiddleware);

const server = app.listen(PORT, () => {
    console.log(`🚀  [SaaS] Server running on http://localhost:${PORT}`);
    console.log(`📡  [Telemetry] Monitoring active...`);
});

// ─── Graceful Shutdown ────────────────────────────────────────
process.on("SIGTERM", () => {
    console.info("SIGTERM signal received. Closing HTTP server...");
    server.close(() => console.log("HTTP server closed."));
});
process.on("SIGINT", () => {
    console.info("SIGINT signal received. Closing HTTP server...");
    server.close(() => console.log("HTTP server closed."));
});
