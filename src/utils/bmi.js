/**
 * Calculate BMI and return category
 * @param {number} weightKg
 * @param {number} heightCm
 * @returns {{ bmi: number, category: string }}
 */
function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  const bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));

  let category;
  if (bmi < 18.5) category = "Underweight";
  else if (bmi < 25) category = "Normal";
  else if (bmi < 30) category = "Overweight";
  else category = "Obese";

  return { bmi, category };
}

module.exports = { calculateBMI };
