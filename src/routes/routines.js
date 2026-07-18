const { Router } = require("express");
const { connectDB } = require("../db");
const auth = require("../middleware/auth");

const router = Router();

// GET /api/routines — get the current user's saved AI workout routines
router.get("/", auth, async (req, res, next) => {
    try {
        const db = await connectDB();
        const doc = await db
            .collection("routines")
            .findOne({ userId: req.user.id });

        if (!doc) {
            return res.json({ routines: [] });
        }

        res.json({ routines: doc.routines || [] });
    } catch (err) {
        next(err);
    }
});

// POST /api/routines — save (replace) the current user's AI workout routines
router.post("/", auth, async (req, res, next) => {
    try {
        const db = await connectDB();
        const { routines } = req.body;

        if (!Array.isArray(routines)) {
            return res.status(400).json({ error: "routines must be an array" });
        }

        await db.collection("routines").updateOne(
            { userId: req.user.id },
            { $set: { routines, userId: req.user.id, updatedAt: new Date() } },
            { upsert: true }
        );

        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/routines — clear the current user's saved routines
router.delete("/", auth, async (req, res, next) => {
    try {
        const db = await connectDB();
        await db.collection("routines").deleteOne({ userId: req.user.id });
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

module.exports = router;