const { Router } = require("express");
const { connectDB } = require("../db");
const auth = require("../middleware/auth");

const router = Router();

// GET /api/nutrition/foods — search for foods (public route)
router.get("/foods", async (req, res, next) => {
  try {
    const { search } = req.query;
    const db = await connectDB();
    
    let query = {};
    if (search) {
      query = { name: { $regex: search, $options: "i" } };
    }
    
    const foods = await db.collection("foods").find(query).limit(30).toArray();
    res.json(foods);
  } catch (err) {
    next(err);
  }
});

// GET /api/nutrition — list user's food logs (newest first)
router.get("/", auth, async (req, res, next) => {
  try {
    const db = await connectDB();
    const foodLogs = await db
      .collection("nutrition")
      .find({ userId: req.user.id })
      .sort({ date: -1, _id: -1 })
      .toArray();

    res.json(foodLogs);
  } catch (err) {
    next(err);
  }
});

// POST /api/nutrition — log a new food entry
router.post("/", auth, async (req, res, next) => {
  try {
    const db = await connectDB();
    const { id, name, calories, date } = req.body;

    await db.collection("nutrition").insertOne({
      id,
      userId: req.user.id,
      name,
      calories,
      date,
      createdAt: new Date(),
    });

    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/nutrition?id=... — remove a food log entry
router.delete("/", auth, async (req, res, next) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing id query param" });

    const db = await connectDB();
    await db.collection("nutrition").deleteOne({ id, userId: req.user.id });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
