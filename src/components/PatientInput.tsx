import { useState, type ReactNode } from 'react';
import type { PatientData } from '../App';
import { availableOrganizations } from '../guidelines/ruleEngine';

const initial: PatientData = {
  physician: '', patientName: '', mrn: '', roomNumber: '', indication: '', allergies: '', specialInstructions: '',
  guidelineOrganization: availableOrganizations.includes('ASPEN') ? 'ASPEN' : availableOrganizations[0] ?? 'ALL',
  goalOfTherapy: 'maintenance', route: 'central', fluidRestricted: false, fluidRestrictionMl: null,
  ageYears: 40, heightInches: 67, weight: 70, gender: 'male', patientGroup: 'adult', ventilator: false,
  minuteVentilation: null, maxTemperatureF: null, burns: false, trauma: false, recentWeightChanges: '',
  tpnIndicated: true, dietician: '', pharmacist: '', prematurityStatus: 'not_applicable', clinicalStatus: 'stable',
  postnatalAgeDays: null, ageMonths: null, birthWeightKg: null, bloodGlucose: null, serumPhosphate: null, serumTriglycerides: null,
  renalDisease: false, hepaticDisease: false, sepsis: false, cholestasis: false, desiredCalories: null, desiredProtein: null, cycleVolume: null,
  cycleHours: null, taperUpHours: null, taperDownHours: null, days: 1
};

export function PatientInput({ onCalculate }: { onCalculate: (data: PatientData) => void }) {
  const [data, setData] = useState<PatientData>(initial);
  const isNeonate = data.patientGroup === 'preterm' || data.patientGroup === 'term_neonate';
  const isChild = data.patientGroup === 'child' || data.patientGroup === 'critical_child';
  const isCritical = data.patientGroup === 'critical_adult' || data.patientGroup === 'critical_child';
  const number = (key: keyof PatientData, label: string, unit = '', required = false) => <label>{label}<div className="input-with-unit"><input required={required} type="number" step="any" min={key === 'days' ? 1 : undefined} max={key === 'days' ? 30 : undefined} value={(data[key] as number | null) ?? ''} onChange={event => setData({ ...data, [key]: event.target.value === '' ? null : Number(event.target.value) })}/>{unit && <span>{unit}</span>}</div></label>;
  const toggle = (key: keyof PatientData, label: string) => <label className="condition-toggle"><input type="checkbox" checked={Boolean(data[key])} onChange={event => setData({ ...data, [key]: event.target.checked })}/><span>{label}</span></label>;
  const section = (title: string, children: ReactNode) => <fieldset><legend>{title}</legend><div className="form-grid">{children}</div></fieldset>;
  const selectPopulation = (patientGroup: PatientData['patientGroup']) => setData({ ...data, patientGroup, prematurityStatus: patientGroup === 'preterm' ? 'preterm' : patientGroup === 'term_neonate' ? 'term' : 'not_applicable', ageYears: patientGroup === 'preterm' || patientGroup === 'term_neonate' ? 0 : data.ageYears });

  return <form className="pn-form" onSubmit={event => { event.preventDefault(); onCalculate(data); }}>
    <div className="form-toolbar"><div><p className="eyebrow">Patient assessment</p><h2>Create a nutrition plan</h2></div></div>

    {section('Plan settings', <>
      <label>Patient population<select value={data.patientGroup} onChange={event => selectPopulation(event.target.value as PatientData['patientGroup'])}><option value="adult">Adult</option><option value="critical_adult">Critically ill adult</option><option value="child">Child (1 month–17 years)</option><option value="critical_child">Critically ill child</option><option value="preterm">Preterm neonate</option><option value="term_neonate">Term neonate</option></select></label>
      <label>Guideline organization<select value={data.guidelineOrganization} onChange={event => setData({ ...data, guidelineOrganization: event.target.value })}><option value="ALL">Use all available guidelines</option>{availableOrganizations.map(organization => <option value={organization} key={organization}>{organization}</option>)}</select></label>
      <label>Venous access<select value={data.route} onChange={event => setData({ ...data, route: event.target.value as PatientData['route'] })}><option value="central">Central venous access</option><option value="peripheral">Peripheral venous access</option></select></label>
      <label>Nutrition goal<select value={data.goalOfTherapy} onChange={event => setData({ ...data, goalOfTherapy: event.target.value as PatientData['goalOfTherapy'] })}><option value="maintenance">Maintenance</option><option value="repletion">Nutrition repletion</option></select></label>
      {number('days', 'Plan duration', 'days', true)}
    </>)}

    {section('Patient demographics', <>
      {!isNeonate && number('ageYears', 'Age', 'years', true)}
      {isChild && number('ageMonths', 'Age when under 2 years', 'months')}
      {isNeonate && number('postnatalAgeDays', 'Postnatal age', 'days', true)}
      {isNeonate && number('birthWeightKg', 'Birth weight', 'kg')}
      {number('weight', 'Current weight', 'kg', true)}
      {!isNeonate && number('heightInches', 'Height', 'inches', true)}
      <label>Sex<select value={data.gender} onChange={event => setData({ ...data, gender: event.target.value as PatientData['gender'] })}><option value="male">Male</option><option value="female">Female</option></select></label>
    </>)}

    {section('Clinical conditions', <>
      <label>Current clinical state<select value={data.clinicalStatus} onChange={event => setData({ ...data, clinicalStatus: event.target.value as PatientData['clinicalStatus'] })}><option value="stable">Clinically stable</option><option value="starting PN">Starting parenteral nutrition</option><option value="after change of PN bag">After a PN bag change</option><option value="critical">Critical illness</option></select></label>
      {toggle('renalDisease', 'Acute kidney injury or renal disease')}
      {toggle('hepaticDisease', 'Liver dysfunction')}
      {toggle('sepsis', 'Sepsis')}
      {(isNeonate || isChild) && toggle('cholestasis', 'Cholestasis')}
      {!isNeonate && toggle('burns', 'Major burns')}
      {!isNeonate && toggle('trauma', 'Major trauma')}
      {(isCritical || !isNeonate) && toggle('ventilator', 'Mechanical ventilation')}
      {data.ventilator && number('minuteVentilation', 'Minute ventilation', 'L/min')}
      {!isNeonate && number('maxTemperatureF', 'Highest temperature', '°F')}
      {toggle('fluidRestricted', 'Fluid restriction')}
      {data.fluidRestricted && number('fluidRestrictionMl', 'Maximum daily fluid', 'mL/day')}
    </>)}

    {section('Laboratory values', <>
      {number('bloodGlucose', 'Blood glucose', 'mmol/L')}
      {number('serumPhosphate', 'Serum phosphate', 'mmol/L')}
      {number('serumTriglycerides', 'Serum triglycerides', 'mmol/L')}
    </>)}

    <div className="form-submit"><button type="submit" className="primary-action">Calculate PN plan</button></div>
  </form>;
}
