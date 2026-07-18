const { Router } = require("express");
const { ObjectId } = require("mongodb");
const { connectDB } = require("../db");
const auth = require("../middleware/auth");

const router = Router();

// ─── GET /api/routines ──────────────────────────────────────────────────────
// Fetches the user's saved routines out of the 'fittrack' database
router.get("/", auth, async (req, res, next) => {
    try {
        const db = await connectDB();
        const userId = req.user.id; // Extracted as a string by your auth middleware

        // Query flexibility matching how your auth middleware maps IDs
        let query = { userId: userId };
        if (ObjectId.isValid(userId)) {
            query = {
                $or: [
                    { userId: userId },
                    { userId: new ObjectId(userId) }
                ]
            };
        }

        const doc = await db.collection("routines").findOne(query);

        // If no document exists, return empty structure instead of crashing or yielding null
        if (!doc) {
            return res.json({ routines: [] });
        }

        const dataPayload = doc.routines || [];
        return res.json({ routines: Array.isArray(dataPayload) ? dataPayload : [] });
    } catch (err) {
        console.error("Error inside routine GET route:", err);
        next(err);
    }
});

// ─── POST /api/routines ─────────────────────────────────────────────────────
// Updates or inserts the routines structure cleanly without duplicate key errors
router.post("/", auth, async (req, res, next) => {
    try {
        const db = await connectDB();
        const { routines } = req.body;
        const userId = req.user.id; // String format

        if (!Array.isArray(routines)) {
            return res.status(400).json({ error: "routines parameter must be a valid array" });
        }

        // Find match using string or ObjectId structure
        let query = { userId: userId };
        if (ObjectId.isValid(userId)) {
            query = {
                $or: [
                    { userId: userId },
                    { userId: new ObjectId(userId) }
                ]
            };
        }

        // Look up target document first to circumvent MongoDB upsert restriction with $or
        const existingDoc = await db.collection("routines").findOne(query);

        if (existingDoc) {
            // Document exists -> Update it cleanly using its unique _id
            await db.collection("routines").updateOne(
                { _id: existingDoc._id },
                {
                    $set: {
                        routines: routines,
                        updatedAt: new Date()
                    }
                }
            );
        } else {
            // Document does not exist -> Insert fresh configuration mapping
            await db.collection("routines").insertOne({
                userId: userId, // Uniformly saves as string matching req.user.id
                routines: routines,
                updatedAt: new Date()
            });
        }

        return res.json({ success: true, routines });
    } catch (err) {
        console.error("Error inside routine POST route:", err);
        next(err);
    }
});

// ─── DELETE /api/routines ───────────────────────────────────────────────────
// Fully purges routine logs for the authenticated session user
router.delete("/", auth, async (req, res, next) => {
    try {
        const db = await connectDB();
        const userId = req.user.id;

        let query = { userId: userId };
        if (ObjectId.isValid(userId)) {
            query = {
                $or: [
                    { userId: userId },
                    { userId: new ObjectId(userId) }
                ]
            };
        }

        await db.collection("routines").deleteOne(query);
        return res.json({ success: true });
    } catch (err) {
        console.error("Error inside routine DELETE route:", err);
        next(err);
    }
});

module.exports = router;