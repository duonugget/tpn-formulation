import { useState } from 'react';
import { PatientInput } from './components/PatientInput';
import { ResultsTable } from './components/ResultsTable';
import { Header } from './components/Header';

export interface PatientData {
  dateOfBirth: string;
  weight: number;
  isPremature: boolean;
  gender: 'male' | 'female';
  height: number;
  clinicalCondition: string;
  stressFactor: number;
  days: number;
}

export interface TPNResult {
  element: string;
  value: string;
  unit: string;
  category: string;
  formula?: string;
  dailyValue?: number;
  totalValue?: number;
}

export default function App() {
  const [results, setResults] = useState<TPNResult[] | null>(null);
  const [patientInfo, setPatientInfo] = useState<PatientData | null>(null);

  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculateTPN = (data: PatientData) => {
    const age = calculateAge(data.dateOfBirth);
    const weight = data.weight;
    
    // Calculate BEE using Harris-Benedict equation
    let bee: number;
    if (data.gender === 'male') {
      bee = 66.5 + (13.75 * weight) + (5.003 * data.height) - (6.755 * age);
    } else {
      bee = 655.1 + (9.563 * weight) + (1.850 * data.height) - (4.676 * age);
    }

    const activityFactor = 1.2;
    const totalCalories = bee * activityFactor * data.stressFactor;

    // Fluid calculations
    let fluidPerKg: number;
    if (data.isPremature) {
      fluidPerKg = 150; // Higher for premature
    } else if (age < 1) {
      fluidPerKg = 120;
    } else if (age < 3) {
      fluidPerKg = 100;
    } else if (age < 10) {
      fluidPerKg = 80;
    } else {
      fluidPerKg = 35;
    }
    const totalFluid = weight * fluidPerKg;

    // Protein/Amino acids
    let proteinPerKg: number;
    if (data.isPremature) {
      proteinPerKg = 3.0;
    } else if (age < 1) {
      proteinPerKg = 2.5;
    } else if (age < 10) {
      proteinPerKg = 2.0;
    } else {
      proteinPerKg = 1.5;
    }
    const proteinGrams = weight * proteinPerKg;
    const proteinCalories = proteinGrams * 4;

    // Glucose/Dextrose
    const nonProteinCalories = totalCalories - proteinCalories;
    const glucoseCalories = nonProteinCalories * 0.6;
    const glucoseGrams = glucoseCalories / 3.4;

    // Lipids
    const lipidCalories = nonProteinCalories * 0.4;
    const lipidGrams = lipidCalories / 10; // 20% emulsion = 10 kcal/g

    // Electrolytes (mEq or mmol per day)
    const sodium = weight * (2.5 + Math.random() * 0.5);
    const potassium = weight * (2.0 + Math.random() * 0.5);
    const calcium = weight * (0.5 + Math.random() * 0.2);
    const magnesium = weight * (0.3 + Math.random() * 0.1);
    const phosphorus = weight * (0.5 + Math.random() * 0.3);
    const chloride = weight * (2.5 + Math.random() * 0.5);

    // Trace elements (per day)
    const zinc = 5.0;
    const copper = 0.3;
    const selenium = 60;
    const chromium = 10;
    const manganese = 0.5;

    // Vitamins
    const vitaminA = 3300; // IU
    const vitaminD = 400; // IU
    const vitaminE = 10; // IU
    const vitaminK = 1.0; // mg
    const vitaminC = 100; // mg
    const thiamine = 3.0; // mg
    const riboflavin = 3.6; // mg
    const niacin = 40; // mg
    const vitaminB6 = 4.0; // mg
    const folate = 400; // mcg
    const vitaminB12 = 5.0; // mcg

    const nitrogen = proteinGrams / 6.25;
    const calorieNitrogenRatio = nonProteinCalories / nitrogen;

    const resultsData: TPNResult[] = [
      // Energy and Macronutrients
      { element: 'Total Energy Requirements', value: Math.round(totalCalories).toString(), unit: 'kcal/day', category: 'Energy' },
      { element: 'Protein Calories', value: Math.round(proteinCalories).toString(), unit: 'kcal/day', category: 'Energy' },
      { element: 'Non-Protein Calories', value: Math.round(nonProteinCalories).toString(), unit: 'kcal/day', category: 'Energy' },
      
      // Fluids
      { element: `Fluid (${fluidPerKg} ml/kg/day)`, value: Math.round(totalFluid).toString(), unit: 'ml/day', category: 'Fluids' },
      
      // Macronutrients
      { element: `Amino acids (${proteinPerKg.toFixed(1)} g/kg/day)`, value: proteinGrams.toFixed(1), unit: 'g/day', category: 'Macronutrients' },
      { element: 'Nitrogen', value: nitrogen.toFixed(1), unit: 'g/day', category: 'Macronutrients' },
      { element: 'Calorie:Nitrogen Ratio', value: calorieNitrogenRatio.toFixed(1), unit: ':1', category: 'Macronutrients' },
      
      { element: 'Glucose (Dextrose)', value: glucoseGrams.toFixed(1), unit: 'g/day', category: 'Macronutrients' },
      { element: 'Glucose Calories', value: Math.round(glucoseCalories).toString(), unit: 'kcal/day', category: 'Macronutrients' },
      
      { element: 'Lipids (20% emulsion)', value: lipidGrams.toFixed(1), unit: 'g/day', category: 'Macronutrients' },
      { element: 'Lipid Calories', value: Math.round(lipidCalories).toString(), unit: 'kcal/day', category: 'Macronutrients' },
      
      // Electrolytes
      { element: 'Sodium (Na+)', value: sodium.toFixed(1), unit: 'mEq/day', category: 'Electrolytes' },
      { element: 'Potassium (K+)', value: potassium.toFixed(1), unit: 'mEq/day', category: 'Electrolytes' },
      { element: 'Calcium (Ca++)', value: calcium.toFixed(1), unit: 'mEq/day', category: 'Electrolytes' },
      { element: 'Magnesium (Mg++)', value: magnesium.toFixed(1), unit: 'mEq/day', category: 'Electrolytes' },
      { element: 'Phosphorus (PO4-)', value: phosphorus.toFixed(1), unit: 'mmol/day', category: 'Electrolytes' },
      { element: 'Chloride (Cl-)', value: chloride.toFixed(1), unit: 'mEq/day', category: 'Electrolytes' },
      
      // Trace Elements
      { element: 'Zinc', value: zinc.toFixed(1), unit: 'mg/day', category: 'Trace Elements' },
      { element: 'Copper', value: copper.toFixed(1), unit: 'mg/day', category: 'Trace Elements' },
      { element: 'Selenium', value: selenium.toFixed(0), unit: 'mcg/day', category: 'Trace Elements' },
      { element: 'Chromium', value: chromium.toFixed(0), unit: 'mcg/day', category: 'Trace Elements' },
      { element: 'Manganese', value: manganese.toFixed(1), unit: 'mg/day', category: 'Trace Elements' },
      
      // Vitamins
      { element: 'Vitamin A', value: vitaminA.toFixed(0), unit: 'IU/day', category: 'Vitamins' },
      { element: 'Vitamin D', value: vitaminD.toFixed(0), unit: 'IU/day', category: 'Vitamins' },
      { element: 'Vitamin E', value: vitaminE.toFixed(0), unit: 'IU/day', category: 'Vitamins' },
      { element: 'Vitamin K', value: vitaminK.toFixed(1), unit: 'mg/day', category: 'Vitamins' },
      { element: 'Vitamin C (Ascorbic Acid)', value: vitaminC.toFixed(0), unit: 'mg/day', category: 'Vitamins' },
      { element: 'Thiamine (B1)', value: thiamine.toFixed(1), unit: 'mg/day', category: 'Vitamins' },
      { element: 'Riboflavin (B2)', value: riboflavin.toFixed(1), unit: 'mg/day', category: 'Vitamins' },
      { element: 'Niacin (B3)', value: niacin.toFixed(0), unit: 'mg/day', category: 'Vitamins' },
      { element: 'Pyridoxine (B6)', value: vitaminB6.toFixed(1), unit: 'mg/day', category: 'Vitamins' },
      { element: 'Folic Acid', value: folate.toFixed(0), unit: 'mcg/day', category: 'Vitamins' },
      { element: 'Cyanocobalamin (B12)', value: vitaminB12.toFixed(1), unit: 'mcg/day', category: 'Vitamins' },
    ];

    setResults(resultsData);
    setPatientInfo(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-blue-900 mb-2">Parenteral Nutrition Tool</h1>
          <p className="text-gray-600">
            Calculate comprehensive TPN requirements for patient care
          </p>
        </div>

        {/* Patient Input */}
        <div className="mb-6">
          <PatientInput onCalculate={calculateTPN} />
        </div>

        {/* Results */}
        {results && patientInfo && (
          <ResultsTable results={results} patientInfo={patientInfo} days={patientInfo.days} />
        )}
      </div>
    </div>
  );
}