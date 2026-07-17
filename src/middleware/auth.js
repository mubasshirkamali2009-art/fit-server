const { ObjectId } = require("mongodb");
const { connectDB } = require("../db");

/**
 * Verifies the Bearer Session Token issued by Better Auth.
 * Attaches req.user = { id, email } on success.
 */
async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = header.slice(7);
  try {
    const db = await connectDB();
    
    // Look up session in MongoDB fittrack database
    const session = await db.collection("session").findOne({ token });
    if (!session) {
      return res.status(401).json({ error: "Invalid session token" });
    }

    // Check if the session is expired
    if (new Date() > new Date(session.expiresAt)) {
      return res.status(401).json({ error: "Session expired" });
    }

    // Prepare userId query (handling both string and ObjectId mapping)
    let userQuery = { _id: session.userId };
    if (typeof session.userId === "string" && ObjectId.isValid(session.userId)) {
      userQuery = {
        $or: [
          { _id: session.userId },
          { _id: new ObjectId(session.userId) }
        ]
      };
    }

    // Find the user in 'user' (Better Auth default) or 'users'
    let user = await db.collection("user").findOne(userQuery);
    if (!user) {
      user = await db.collection("users").findOne(userQuery);
    }

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
    };
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = auth;
