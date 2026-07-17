const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let db;

const defaultFoods = [
  { name: "Apple", calories: 52 },          // per 100g
  { name: "Banana", calories: 89 },         // per 100g
  { name: "Chicken Breast", calories: 165 }, // per 100g
  { name: "White Rice (Cooked)", calories: 130 }, // per 100g
  { name: "Egg (Large)", calories: 70 },     // per serving (1 egg)
  { name: "Oatmeal (Cooked)", calories: 68 }, // per 100g
  { name: "Almonds", calories: 579 },       // per 100g
  { name: "Greek Yogurt", calories: 59 },    // per 100g
  { name: "Salmon", calories: 208 },        // per 100g
  { name: "Broccoli", calories: 34 },       // per 100g
  { name: "Peanut Butter", calories: 588 },  // per 100g
  { name: "Milk (Whole)", calories: 61 },    // per 100g/ml
  { name: "Avocado", calories: 160 },       // per 100g
  { name: "Sweet Potato", calories: 86 },   // per 100g
  { name: "Tuna (Canned)", calories: 116 },  // per 100g
  { name: "Spinach", calories: 23 },         // per 100g
  { name: "Olive Oil", calories: 884 },     // per 100g
  { name: "Whey Protein Powder", calories: 120 }, // per scoop (30g)
  { name: "Whole Wheat Bread", calories: 247 }, // per 100g
  { name: "Cottage Cheese", calories: 98 }  // per 100g
];

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("fittrack");
    console.log("✅ Connected to MongoDB Atlas (fittrack)");

    // Seed foods collection if empty
    try {
      const foodCount = await db.collection("foods").countDocuments();
      if (foodCount === 0) {
        await db.collection("foods").insertMany(defaultFoods);
        console.log("🌱 Seeded initial food database successfully");
      }
    } catch (err) {
      console.error("Failed to seed foods collection:", err);
    }
  }
  return db;
}

module.exports = { connectDB };
