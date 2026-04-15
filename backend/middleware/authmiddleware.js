const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authheader = req.header("authorization");

  if (!authheader || !authheader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "acces denied no token found" });
  }

  try {
    const token = authheader.split(" ")[1];
    const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key_123";
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// isadmin middleware
const isadmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }

  return res.status(403).json({ message: "Admin access required" });
};
module.exports = { authMiddleware, isadmin };
