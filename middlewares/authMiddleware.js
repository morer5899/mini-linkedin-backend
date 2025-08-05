import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {
    // ✅ Extract token directly from cookies (avoid unnecessary operations)
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "Access Denied: No Token Provided" });
    }

    // ✅ Verify and attach user data synchronously (Avoid `await`)
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        const message =
          err.name === "TokenExpiredError"
            ? "Token Expired. Please log in again."
            : "Invalid Token. Please log in again.";
        return res.status(401).json({ success: false, message });
      }

      req.user = decoded; // ✅ Attach decoded user data

      return next(); // ✅ Pass control to the next middleware
    });
  } catch (error) {
    console.error("Auth Middleware Error ===>", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export default authMiddleware;
