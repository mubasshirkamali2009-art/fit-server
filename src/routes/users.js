const { Router } = require("express");
const { ObjectId } = require("mongodb");
const { connectDB } = require("../db");
const auth = require("../middleware/auth");
const { calculateBMI } = require("../utils/bmi");

const router = Router();

// GET /api/users/me — own profile
router.get("/me", auth, async (req, res, next) => {
  try {
    const db = await connectDB();
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(req.user.id) });

    if (!user) return res.status(404).json({ error: "User not found" });
    const { password, ...safe } = user;
    res.json(safe);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/me — update height/weight/age/goal + recalculate BMI
router.patch("/me", auth, async (req, res, next) => {
  try {
    const db = await connectDB();
    const { height, weight, age, goal, name } = req.body;

    const update = {};
    if (name !== undefined) update.name = name;
    if (height !== undefined) update.height = height;
    if (weight !== undefined) update.weight = weight;
    if (age !== undefined) update.age = age;
    if (goal !== undefined) update.goal = goal;

    // Fetch current to recalculate BMI if height or weight change
    if (height !== undefined || weight !== undefined) {
      const current = await db
        .collection("users")
        .findOne({ _id: new ObjectId(req.user.id) });
      const newWeight = weight ?? current?.weight;
      const newHeight = height ?? current?.height;
      const bmiResult = calculateBMI(newWeight, newHeight);
      if (bmiResult) {
        update.bmi = bmiResult.bmi;
        update.bmiCategory = bmiResult.category;
      }
    }

    update.updatedAt = new Date();

    const result = await db.collection("users").findOneAndUpdate(
      { _id: new ObjectId(req.user.id) },
      { $set: update },
      { returnDocument: "after", upsert: false }
    );

    if (!result) return res.status(404).json({ error: "User not found" });
    const { password, ...safe } = result;
    res.json(safe);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
