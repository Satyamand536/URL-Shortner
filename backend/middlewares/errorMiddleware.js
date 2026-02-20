function errorMiddleware(err, req, res, next) {
    console.error("❌ [SERVER ERROR]:", err.stack);

    const statusCode = err.status || 500;
    const message = err.message || "Something went wrong on our side.";

    res.status(statusCode).json({
        error: message,
        stack: process.env.NODE_ENV === "production" ? "🔒 Protected" : err.stack,
        timestamp: new Date().toISOString()
    });
}

module.exports = errorMiddleware;
