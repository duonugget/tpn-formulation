import { useState } from 'react';
import { PatientInput } from './components/PatientInput';
import { ResultsTable } from './components/ResultsTable';
import { evaluateRules } from './guidelines/ruleEngine';
import './styles/pn-ui.css';

export interface PatientData {
  physician: string; patientName: string; mrn: string; roomNumber: string; indication: string; allergies: string; specialInstructions: string;
  guidelineOrganization: string;
  goalOfTherapy: 'maintenance' | 'repletion'; route: 'central' | 'peripheral'; fluidRestricted: boolean; fluidRestrictionMl: number | null;
  ageYears: number; heightInches: number; weight: number; gender: 'male' | 'female'; patientGroup: 'adult' | 'critical_adult' | 'preterm' | 'term_neonate' | 'child' | 'critical_child'; ventilator: boolean; minuteVentilation: number | null;
  maxTemperatureF: number | null; burns: boolean; trauma: boolean; recentWeightChanges: string; tpnIndicated: boolean; dietician: string; pharmacist: string;
  prematurityStatus: 'preterm' | 'term' | 'not_applicable' | 'unknown'; clinicalStatus: 'starting PN' | 'after change of PN bag' | 'stable' | 'critical'; postnatalAgeDays: number | null; ageMonths: number | null; birthWeightKg: number | null; bloodGlucose: number | null; serumPhosphate: number | null; serumTriglycerides: number | null; renalDisease: boolean; hepaticDisease: boolean; sepsis: boolean; cholestasis: boolean;
  desiredCalories: number | null; desiredProtein: number | null;
  cycleVolume: number | null; cycleHours: number | null; taperUpHours: number | null; taperDownHours: number | null; days: number; planDuration?: number;
}

export interface TPNResult { element: string; value: string; unit: string; category: string; detail?: string; perKg?: string; source?: string; }
export interface InferenceStep { source: string; ruleId: string; title: string; matched: boolean; conditions: string[]; outputs: string[]; }
export interface TPNCalculation { totalCalories: number; proteinGrams: number; proteinCalories: number; dextroseGrams: number; dextroseCalories: number; lipidGrams: number; lipidCalories: number; fluidRequirement: number; nitrogenGrams: number; calorieToNitrogenRatio: number; }

export default function App() {
  const [plans, setPlans] = useState<TPNResult[][] | null>(null);
  const [patientInfo, setPatientInfo] = useState<PatientData | null>(null);
  const calculateTPN = (data: PatientData) => { const duration = Math.max(1, Math.min(30, data.days)); const inferences = []; let previousPlan: TPNResult[] = []; for (let day = 1; day <= duration; day++) { const inference = evaluateRules({ ...data, days: day, planDuration: duration }, previousPlan); inferences.push(inference); previousPlan = inference.results; } setPlans(inferences.map(item => item.results)); setPatientInfo(data); };
  return <main className="app-shell"><div className="app-container"><header className="app-header"><div><p className="eyebrow">Clinical decision support</p><h1>Parenteral nutrition planner</h1></div><div className="header-note">Not a prescription<br/><span>Clinical review required</span></div></header><PatientInput onCalculate={calculateTPN}/>{plans && patientInfo && <ResultsTable plans={plans} patientInfo={patientInfo}/>}</div></main>;
}
