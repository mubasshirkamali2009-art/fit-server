const { Router } = require("express");
const auth = require("../middleware/auth");

const router = Router();

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

router.post("/", auth, async (req, res, next) => {
  try {
    const { action } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (action !== "generate-diet") {
      return res.status(400).json({ error: "Invalid action" });
    }

    if (!apiKey) {
      console.warn("GEMINI_API_KEY not set — using offline mock mode.");
      return res.json(getMockDietPlan(req.body.goal || "maintain"));
    }

    const { weight, height, age, goal, gender, activityLevel } = req.body;

    const prompt = `You are a professional dietitian and health planner.
Create a customized full-day eating plan for a user with these stats:
- Gender: ${gender || "unspecified"}
- Weight: ${weight || 70} kg
- Height: ${height || 170} cm
- Age: ${age || 25} years old
- Fitness Goal: ${goal || "maintain"} (bulk, cut, or maintain)
- Activity Level: ${activityLevel || "moderate"}

Structure the plan into meals: Breakfast, Morning Snack (optional), Lunch, Afternoon Snack (optional), Dinner.
For each meal, suggest healthy food items, portion sizes, and calorie counts.
Also provide the total calculated daily calories, daily macronutrients (carbs, protein, fat in grams), and a list of 3 dietitian tips tailored to their goal.

Respond ONLY with a JSON object matching this schema. Do not output any backticks or markdown:
{
  "meals": [
    {
      "name": "Breakfast",
      "description": "Portion size, food details",
      "calories": 450
    }
  ],
  "totalCalories": 2000,
  "macros": {
    "carbs": 220,
    "protein": 130,
    "fat": 65
  },
  "dietitianTips": [
    "Tip 1",
    "Tip 2",
    "Tip 3"
  ]
}`;

    const plan = await callGemini(prompt, apiKey);
    return res.json(plan);
  } catch (err) {
    console.error("AI Route error:", err);
    // If Gemini fails, fallback gracefully to mock plan so user experience is not broken
    return res.json(getMockDietPlan(req.body.goal || "maintain"));
  }
});

async function callGemini(prompt, apiKey) {
  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Gemini API error:", errText);
    throw new Error("Gemini API call failed");
  }

  const json = await response.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(text);
}

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

  // Default: Maintain
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

module.exports = router;
