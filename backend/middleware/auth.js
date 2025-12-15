import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET||"tyrefusion_secret_key";

if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET missing in .env");
}

/* =====================================================
   AUTH — VERIFY JWT
===================================================== */
export const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select(
      "_id name email role isVerified"
    );

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("JWT Verification Failed:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/* =====================================================
   ADMIN ONLY
===================================================== */
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }

  next();
};
