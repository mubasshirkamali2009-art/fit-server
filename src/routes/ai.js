const { Router } = require("express");
const auth = require("../middleware/auth");
const { connectDB } = require("../db");

const router = Router();

const GEMINI_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

// ─── Get the logged-in user's saved diet plan ──────────────────────────────
router.get("/diet-plan", auth, async (req, res) => {
    try {
        const db = await connectDB();
        const userId = req.user.id || req.user._id;

        const doc = await db.collection("dietPlans").findOne({ userId: String(userId) });
        return res.json({ plan: doc ? doc.plan : null });
    } catch (err) {
        console.error("Failed to fetch diet plan:", err);
        return res.status(500).json({ error: "Failed to fetch diet plan" });
    }
});

// ─── Get the logged-in user's saved routines ───────────────────────────────
router.get("/routines", auth, async (req, res) => {
    try {
        const db = await connectDB();
        const userId = req.user.id || req.user._id;

        const doc = await db.collection("routines").findOne({ userId: String(userId) });
        return res.json({ routines: doc ? doc.routines : null });
    } catch (err) {
        console.error("Failed to fetch routines:", err);
        return res.status(500).json({ error: "Failed to fetch routines" });
    }
});

router.post("/", auth, async (req, res, next) => {
    try {
        const { action } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (action === "generate-diet") {
            return await handleGenerateDiet(req, res, apiKey);
        }

        if (action === "regenerate-diet-questions") {
            return await handleRegenerateQuestions(req, res, apiKey);
        }

        if (action === "routine-questions") {
            return await handleRoutineQuestions(req, res, apiKey);
        }

        if (action === "generate-routines") {
            return await handleGenerateRoutines(req, res, apiKey);
        }

        if (action === "regenerate-routine-questions") {
            return await handleRegenerateRoutineQuestions(req, res, apiKey);
        }

        return res.status(400).json({ error: "Invalid action" });
    } catch (err) {
        console.error("AI Route error:", err);
        return res.json(getMockDietPlan(req.body.goal || "maintain"));
    }
});

// ─── Helper: persist a diet plan for the logged-in user ────────────────────
async function saveDietPlan(user, plan) {
    if (!user) return;
    try {
        const db = await connectDB();
        const userId = user.id || user._id;

        await db.collection("dietPlans").updateOne(
            { userId: String(userId) },
            { $set: { plan, userId: String(userId), updatedAt: new Date() } },
            { upsert: true }
        );
    } catch (err) {
        console.error("Failed to save diet plan to MongoDB:", err);
    }
}

// ─── Helper: persist routines for the logged-in user ───────────────────────
async function saveRoutines(user, routines) {
    if (!user) return;
    try {
        const db = await connectDB();
        const userId = user.id || user._id;

        await db.collection("routines").updateOne(
            { userId: String(userId) },
            { $set: { routines, userId: String(userId), updatedAt: new Date() } },
            { upsert: true }
        );
    } catch (err) {
        console.error("Failed to save routines to MongoDB:", err);
    }
}

// ─── Action: generate-diet ─────────────────────────────────────────────────
async function handleGenerateDiet(req, res, apiKey) {
    const {
        weight,
        height,
        age,
        goal,
        gender,
        activityLevel,
        previousPlan,
        regenerateAnswers,
    } = req.body;

    if (!apiKey) {
        console.warn("GEMINI_API_KEY not set — using offline mock mode.");
        const mock = getMockDietPlan(goal || "maintain");
        await saveDietPlan(req.user, mock);
        return res.json(mock);
    }

    let prompt = `You are a professional dietitian and health planner.
Create a customized full-day eating plan for a user with these stats:
- Gender: ${gender || "unspecified"}
- Weight: ${weight || 70} kg
- Height: ${height || 170} cm
- Age: ${age || 25} years old
- Fitness Goal: ${goal || "maintain"} (bulk, cut, or maintain)
- Activity Level: ${activityLevel || "moderate"}`;

    if (previousPlan) {
        prompt += `\n\nThe user previously received this plan and wants a revised version:
${JSON.stringify(previousPlan)}`;
    }

    if (regenerateAnswers && Object.keys(regenerateAnswers).length > 0) {
        prompt += `\n\nThe user answered these clarifying questions about what to change:
${Object.entries(regenerateAnswers)
                .map(([id, answer]) => `- ${answer}`)
                .join("\n")}
Use these answers to meaningfully adjust the new plan (different meals, portions, or macro balance as appropriate). Do not just repeat the previous plan.`;
    }

    prompt += `

Structure the plan into meals: Breakfast, Morning Snack (optional), Lunch, Afternoon Snack (optional), Dinner.
For each meal, suggest healthy food items, portion sizes, and calorie counts.
Also provide the total calculated daily calories, daily macronutrients (carbs, protein, fat in grams), and a list of 3 dietitian tips tailored to their goal.

Respond ONLY with a JSON object matching this schema. Do not output any backticks or markdown:
{
  "meals": [
    { "name": "Breakfast", "description": "Portion size, food details", "calories": 450 }
  ],
  "totalCalories": 2000,
  "macros": { "carbs": 220, "protein": 130, "fat": 65 },
  "dietitianTips": ["Tip 1", "Tip 2", "Tip 3"]
}`;

    try {
        const plan = await callGemini(prompt, apiKey);
        await saveDietPlan(req.user, plan);
        return res.json(plan);
    } catch (err) {
        console.error("Gemini generate-diet failed, falling back to mock:", err);
        const mock = getMockDietPlan(goal || "maintain");
        await saveDietPlan(req.user, mock);
        return res.json(mock);
    }
}

// ─── Action: regenerate-diet-questions ─────────────────────────────────────
async function handleRegenerateQuestions(req, res, apiKey) {
    const { currentPlan, goal, activityLevel } = req.body;

    if (!apiKey) {
        console.warn("GEMINI_API_KEY not set — skipping AI questions, going straight to regenerate.");
        return res.json({ questions: [] });
    }

    const prompt = `You are a professional dietitian assistant helping a user regenerate their diet plan.
Here is their current plan:
${JSON.stringify(currentPlan)}

Their fitness goal is: ${goal || "maintain"}, activity level: ${activityLevel || "moderate"}.

Come up with exactly 1 or 2 short, specific clarifying questions to ask the user before generating a revised plan. Keep each question under 15 words.

Respond ONLY with a JSON object matching this schema, no markdown or backticks:
{ "questions": [ { "id": "q1", "question": "..." } ] }`;

    try {
        const result = await callGemini(prompt, apiKey);
        return res.json(result);
    } catch (err) {
        console.error("Gemini regenerate-questions failed, skipping questions:", err);
        return res.json({ questions: [] });
    }
}

// ─── Action: routine-questions ─────────────────────────────────────────────
async function handleRoutineQuestions(req, res, apiKey) {
    const { goal, activityLevel, freeText } = req.body;

    if (!apiKey) {
        console.warn("GEMINI_API_KEY not set — skipping AI questions, going straight to routine generation.");
        return res.json({ questions: [] });
    }

    const prompt = `You are an expert fitness coach and behavioral psychologist designing a personalized weekly workout routine.
Before generating the routine, you want to understand the user as a person — not just their stats.

User's fitness goal: ${goal || "general fitness"}
Activity level: ${activityLevel || "moderate"}
${freeText ? `The user already shared this about themselves: "${freeText}"` : ""}

Come up with 3 to 5 short, thoughtful questions about their daily life, hobbies, personality, schedule, or even hypothetical scenarios (e.g. "if you had one free hour a day, what would you do with it?", "do you prefer competing against others or against yourself?") that would genuinely help you design a workout routine that fits who they are, not just their body stats. Keep each question under 18 words. Do not ask about height/weight/age — assume that data is already known.

Respond ONLY with a JSON object matching this schema, no markdown or backticks:
{ "questions": [ { "id": "q1", "question": "..." } ] }`;

    try {
        const result = await callGemini(prompt, apiKey);
        return res.json(result);
    } catch (err) {
        console.error("Gemini routine-questions failed, skipping questions:", err);
        return res.json({ questions: [] });
    }
}

// ─── Action: generate-routines ─────────────────────────────────────────────
async function handleGenerateRoutines(req, res, apiKey) {
    const {
        weight,
        height,
        age,
        goal,
        gender,
        activityLevel,
        answers,
        freeText,
        previousRoutines,
        regenerateAnswers,
    } = req.body;

    if (!apiKey) {
        console.warn("GEMINI_API_KEY not set — using offline mock mode.");
        const mock = getMockRoutines(goal || "general fitness");
        await saveRoutines(req.user, mock);
        return res.json(mock);
    }

    let prompt = `You are an expert fitness coach with deep knowledge of established, evidence-based training methodologies (e.g. Push/Pull/Legs, Upper/Lower splits, Full Body 3x/week, 5x5 strength programs, HIIT circuits, hybrid conditioning programs, etc). You know which of these are considered the best and most effective for different goals, experience levels, and lifestyles.

Design 3 distinct, complete weekly workout routines for this user. Base each routine on a real, well-regarded training methodology suited to their goal, activity level, and lifestyle — don't invent arbitrary exercise combinations. Select and adapt the methodology (exercise selection, volume, split structure, weekly frequency) specifically to fit this person's stats, schedule, hobbies, and stated needs, rather than giving a generic template.

User stats:
- Gender: ${gender || "unspecified"}
- Weight: ${weight || 70} kg
- Height: ${height || 170} cm
- Age: ${age || 25} years old
- Fitness Goal: ${goal || "general fitness"}
- Activity Level: ${activityLevel || "moderate"}`;

    if (answers && Object.keys(answers).length > 0) {
        prompt += `\n\nHere is what the user shared about their lifestyle, hobbies, and personality (use this to make the routines feel personally tailored, e.g. matching their schedule, energy patterns, or interests):
${Object.entries(answers)
                .map(([id, answer]) => `- ${answer}`)
                .join("\n")}`;
    }

    if (freeText) {
        prompt += `\n\nThe user also described their condition and needs directly: "${freeText}"`;
    }

    if (previousRoutines) {
        prompt += `\n\nThe user previously received these 3 routines and wants revised versions:
${JSON.stringify(previousRoutines)}`;
    }

    if (regenerateAnswers && Object.keys(regenerateAnswers).length > 0) {
        prompt += `\n\nThe user explained what they didn't like about the previous routines:
${Object.entries(regenerateAnswers)
                .map(([id, answer]) => `- ${answer}`)
                .join("\n")}
Use this feedback to meaningfully change the new routines — do not just repeat the previous ones.`;
    }

    prompt += `

The 3 routines should represent genuinely different, well-established approaches (for example: one strength-focused split, one hybrid/conditioning style, one time-efficient or goal-specific approach) — each picked because it's a recognized effective methodology for this type of user, not just 3 random variations. Each routine should cover all 7 days of the week (use "Rest" for recovery days where appropriate) and include specific exercises with sets/reps or duration for each training day, following the set/rep ranges and structure that methodology is actually known for. Give each of the 3 routines a distinct name and short description that mentions the methodology it's based on and why it fits this user's life and goal.

Respond ONLY with a JSON object matching this schema. Do not output any backticks or markdown:
{
  "routines": [
    {
      "name": "Routine name",
      "description": "1-2 sentence description of this routine's style and who it's for",
      "days": [
        {
          "day": "Monday",
          "focus": "Upper Body Strength",
          "exercises": [
            { "name": "Push-ups", "sets": "3", "reps": "12-15" }
          ]
        }
      ]
    }
  ]
}
For rest days, set "focus": "Rest" and "exercises": [].`;

    try {
        const result = await callGemini(prompt, apiKey);
        await saveRoutines(req.user, result);
        return res.json(result);
    } catch (err) {
        console.error("Gemini generate-routines failed, falling back to mock:", err);
        const mock = getMockRoutines(goal || "general fitness");
        await saveRoutines(req.user, mock);
        return res.json(mock);
    }
}

// ─── Action: regenerate-routine-questions ──────────────────────────────────
async function handleRegenerateRoutineQuestions(req, res, apiKey) {
    const { previousRoutines, goal } = req.body;

    if (!apiKey) {
        console.warn("GEMINI_API_KEY not set — skipping AI questions, going straight to regenerate.");
        return res.json({ questions: [] });
    }

    const prompt = `You are a fitness coach following up with a user after giving them 3 weekly workout routines.
Here are the routines they received:
${JSON.stringify(previousRoutines)}

Their fitness goal is: ${goal || "general fitness"}.

Come up with exactly 1 or 2 short, specific questions to find out what they didn't like or want changed (for example: too many days, disliked certain exercises, wrong difficulty, no equipment access, etc). Keep each question under 15 words.

Respond ONLY with a JSON object matching this schema, no markdown or backticks:
{ "questions": [ { "id": "q1", "question": "..." } ] }`;

    try {
        const result = await callGemini(prompt, apiKey);
        return res.json(result);
    } catch (err) {
        console.error("Gemini regenerate-routine-questions failed, skipping questions:", err);
        return res.json({ questions: [] });
    }
}

// ─── Gemini call ────────────────────────────────────────────────────────────
async function callGemini(prompt, apiKey) {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.4,
            },
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("Gemini API error:", errText);
        throw new Error("Gemini API call failed");
    }

    const json = await response.json();
    let text = json.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        throw new Error("Empty response received from Gemini");
    }

    // Clean markdown wraps if the model added them despite instructions
    text = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

    try {
        return JSON.parse(text);
    } catch (parseError) {
        console.warn("Direct JSON parsing failed, executing format cleanup...", parseError);
        try {
            // strip destructive line breaks or unescaped control markers
            const cleanedText = text
                .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
                .replace(/,\s*([\]}])/g, "$1");
            return JSON.parse(cleanedText);
        } catch (fallbackError) {
            console.error("Raw failed payload:\n", text);
            throw fallbackError;
        }
    }
}

// ─── Mock fallback: diet ────────────────────────────────────────────────────
function getMockDietPlan(goal) {
    if (goal === "cut") {
        return {
            meals: [
                { name: "Breakfast", description: "3 Scrambled Eggs with spinach and 1 slice of whole wheat toast", calories: 310 },
                { name: "Morning Snack", description: "Greek Yogurt (150g) with a handful of blueberries", calories: 130 },
                { name: "Lunch", description: "Grilled Chicken Breast (150g) with quinoa (100g) and mixed salad", calories: 420 },
                { name: "Afternoon Snack", description: "1 medium Apple with 1 tbsp peanut butter", calories: 180 },
                { name: "Dinner", description: "Baked Salmon (150g) with steamed broccoli and sweet potato (100g)", calories: 480 }
            ],
            totalCalories: 1520,
            macros: { carbs: 120, protein: 135, fat: 55 },
            dietitianTips: [
                "Drink at least 3 liters of water daily to support fat oxidation and fullness.",
                "Prioritize lean protein in every meal to preserve muscle mass during a calorie deficit.",
                "Avoid liquid calories (sodas, juices) and focus on fiber-rich vegetables."
            ]
        };
    }
    if (goal === "bulk") {
        return {
            meals: [
                { name: "Breakfast", description: "Oatmeal (100g oats cooked in milk) with 1 banana, 2 tbsp peanut butter, and a scoop of whey protein", calories: 720 },
                { name: "Morning Snack", description: "Handful of mixed nuts (50g) and 2 hardboiled eggs", calories: 430 },
                { name: "Lunch", description: "Double Grilled Chicken Breast (200g) with white rice (200g) and half an avocado", calories: 780 },
                { name: "Afternoon Snack", description: "Fruit smoothie with oats, peanut butter, milk, and honey", calories: 510 },
                { name: "Dinner", description: "Lean Beef Steak (200g) with a large baked potato and roasted asparagus in olive oil", calories: 820 }
            ],
            totalCalories: 3260,
            macros: { carbs: 360, protein: 185, fat: 120 },
            dietitianTips: [
                "Focus on calorie-dense foods like nuts, avocados, and peanut butter to reach your surplus easily.",
                "Eat every 3-4 hours to keep muscle protein synthesis active throughout the day.",
                "Ensure you pair this eating plan with a heavy progressive resistance training program."
            ]
        };
    }
    return {
        meals: [
            { name: "Breakfast", description: "2 Eggs, 2 slices of whole wheat toast, and 1 medium orange", calories: 380 },
            { name: "Morning Snack", description: "Greek Yogurt (150g) with 1 tbsp honey and chia seeds", calories: 190 },
            { name: "Lunch", description: "Turkey and Cheese Sandwich on whole wheat bread, with side salad", calories: 540 },
            { name: "Afternoon Snack", description: "1 Banana and 1oz almonds (approx. 23 nuts)", calories: 260 },
            { name: "Dinner", description: "Grilled Salmon (150g) with brown rice (150g) and roasted green beans", calories: 630 }
        ],
        totalCalories: 2000,
        macros: { carbs: 210, protein: 120, fat: 75 },
        dietitianTips: [
            "Keep meals balanced with equal ratios of complex carbohydrates, clean protein, and healthy fats.",
            "Adjust portion sizes slightly if you feel your daily energy levels dropping during training.",
            "Limit processed sugars and focus on whole foods for sustained energy."
        ]
    };
}

// ─── Mock fallback: workout routines ───────────────────────────────────────
function getMockRoutines(goal) {
    const restDay = { day: "Sunday", focus: "Rest", exercises: [] };

    return {
        routines: [
            {
                name: "Balanced Builder",
                description: "A well-rounded routine mixing strength and cardio, good for steady overall progress.",
                days: [
                    {
                        day: "Monday", focus: "Upper Body Strength", exercises: [
                            { name: "Push-ups", sets: "3", reps: "12-15" },
                            { name: "Dumbbell Rows", sets: "3", reps: "10-12" },
                            { name: "Shoulder Press", sets: "3", reps: "10-12" }
                        ]
                    },
                    {
                        day: "Tuesday", focus: "Cardio", exercises: [
                            { name: "Jogging", sets: "1", reps: "25 min" },
                            { name: "Jump Rope", sets: "3", reps: "2 min" }
                        ]
                    },
                    {
                        day: "Wednesday", focus: "Lower Body Strength", exercises: [
                            { name: "Bodyweight Squats", sets: "4", reps: "15" },
                            { name: "Lunges", sets: "3", reps: "12 each leg" }
                        ]
                    },
                    { day: "Thursday", focus: "Rest", exercises: [] },
                    {
                        day: "Friday", focus: "Full Body Circuit", exercises: [
                            { name: "Burpees", sets: "3", reps: "10" },
                            { name: "Mountain Climbers", sets: "3", reps: "20" },
                            { name: "Plank", sets: "3", reps: "45 sec" }
                        ]
                    },
                    {
                        day: "Saturday", focus: "Light Cardio + Mobility", exercises: [
                            { name: "Brisk Walk", sets: "1", reps: "30 min" },
                            { name: "Stretching Routine", sets: "1", reps: "10 min" }
                        ]
                    },
                    restDay
                ]
            },
            {
                name: "Time-Efficient Blast",
                description: "Short, high-intensity sessions for people with a packed schedule.",
                days: [
                    {
                        day: "Monday", focus: "HIIT Full Body", exercises: [
                            { name: "Jump Squats", sets: "4", reps: "20" },
                            { name: "Push-ups", sets: "4", reps: "15" }
                        ]
                    },
                    { day: "Tuesday", focus: "Rest", exercises: [] },
                    {
                        day: "Wednesday", focus: "HIIT Full Body", exercises: [
                            { name: "Kettlebell Swings", sets: "4", reps: "15" },
                            { name: "Mountain Climbers", sets: "4", reps: "20" }
                        ]
                    },
                    { day: "Thursday", focus: "Rest", exercises: [] },
                    {
                        day: "Friday", focus: "HIIT Full Body", exercises: [
                            { name: "Burpees", sets: "4", reps: "12" },
                            { name: "Plank to Push-up", sets: "3", reps: "10" }
                        ]
                    },
                    {
                        day: "Saturday", focus: "Active Recovery", exercises: [
                            { name: "Light Walk", sets: "1", reps: "20 min" }
                        ]
                    },
                    restDay
                ]
            },
            {
                name: "Strength Focus",
                description: "Progressive strength training for building muscle and power over time.",
                days: [
                    {
                        day: "Monday", focus: "Chest & Triceps", exercises: [
                            { name: "Bench Press / Push-ups", sets: "4", reps: "8-10" },
                            { name: "Tricep Dips", sets: "3", reps: "12" }
                        ]
                    },
                    {
                        day: "Tuesday", focus: "Back & Biceps", exercises: [
                            { name: "Pull-ups / Assisted Pull-ups", sets: "4", reps: "6-8" },
                            { name: "Dumbbell Curls", sets: "3", reps: "12" }
                        ]
                    },
                    { day: "Wednesday", focus: "Rest", exercises: [] },
                    {
                        day: "Thursday", focus: "Legs", exercises: [
                            { name: "Squats", sets: "4", reps: "10" },
                            { name: "Romanian Deadlifts", sets: "3", reps: "10" }
                        ]
                    },
                    {
                        day: "Friday", focus: "Shoulders & Core", exercises: [
                            { name: "Shoulder Press", sets: "4", reps: "10" },
                            { name: "Hanging Leg Raises", sets: "3", reps: "12" }
                        ]
                    },
                    { day: "Saturday", focus: "Rest", exercises: [] },
                    restDay
                ]
            }
        ]
    };
}

module.exports = router;