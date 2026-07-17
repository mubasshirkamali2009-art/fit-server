const { Router } = require("express");
const { connectDB } = require("../db");
const auth = require("../middleware/auth");

const router = Router();

// GET /api/profile — get user profile
router.get("/", auth, async (req, res, next) => {
  try {
    const db = await connectDB();
    const profile = await db
      .collection("profiles")
      .findOne({ userId: req.user.id });

    if (!profile) {
      return res.json({
        height: 0,
        weight: 0,
        age: 0,
        goal: "maintain",
        activityLevel: "moderate",
        calorieTarget: 2000,
        isOnboarded: false,
      });
    }

    const { _id, ...safe } = profile;
    res.json(safe);
  } catch (err) {
    next(err);
  }
});

// POST /api/profile — create or update user profile
router.post("/", auth, async (req, res, next) => {
  try {
    const db = await connectDB();
    // eslint-disable-next-line no-unused-vars
    const { _id, userId, ...profileData } = req.body;

    await db.collection("profiles").updateOne(
      { userId: req.user.id },
      { $set: { ...profileData, userId: req.user.id, updatedAt: new Date() } },
      { upsert: true }
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
