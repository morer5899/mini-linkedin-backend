import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {
    console.log('Incoming cookies:', req.cookies);
    console.log('Auth header:', req.headers.authorization);
    
    const token = req.cookies?.token || 
                 req.headers?.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('Token sources:', {
        cookies: req.cookies,
        headers: req.headers.authorization
      });
      return res.status(401).json({ 
        success: false, 
        message: "Access Denied: No Token Provided" 
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.log('Token verification error:', err.message);
        const message = err.name === "TokenExpiredError" 
          ? "Token Expired. Please log in again."
          : "Invalid Token. Please log in again.";
        return res.status(401).json({ success: false, message });
      }

      req.user = decoded;
      return next();
    });
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
};

export default authMiddleware;
