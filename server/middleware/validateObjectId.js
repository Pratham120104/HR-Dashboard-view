// middleware/validateObjectId.js
import mongoose from "mongoose";

/**
 * Middleware to validate a MongoDB ObjectId in route params.
 *
 * @param {string} paramName - The name of the param to validate (default: "id").
 * @returns Express middleware function
 */
export default function validateObjectId(paramName = "id") {
  return (req, res, next) => {
    const id = req.params?.[paramName];

    // Ensure param is provided
    if (!id) {
      return res.status(400).json({
        success: false,
        message: `${paramName} is required in route parameters.`,
      });
    }

    // Validate ObjectId format
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName}: "${id}"`,
      });
    }

    next();
  };
}
