// middleware/error.js

// 404 handler (for unknown routes)
export const notFound = (req, res, _next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};

// Global error handler
export const errorHandler = (err, _req, res, _next) => {
  console.error("❌ Server Error:", err);

  const code = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(code).json({
    success: false,
    message: err.message || "Internal Server Error",
    // Only expose stack trace in development mode
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};
