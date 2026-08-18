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
  const basePopulation = data.patientGroup === 'critical_adult' ? 'adult' : data.patientGroup === 'critical_child' ? 'child' : data.patientGroup;
  const number = (key: keyof PatientData, label: string, unit = '', required = false) => <label>{label}<div className="input-with-unit"><input required={required} type="number" step="any" min={key === 'days' ? 1 : undefined} max={key === 'days' ? 30 : undefined} value={(data[key] as number | null) ?? ''} onChange={event => setData({ ...data, [key]: event.target.value === '' ? null : Number(event.target.value) })}/>{unit && <span>{unit}</span>}</div></label>;
  const toggle = (key: keyof PatientData, label: string) => <label className="condition-toggle"><input type="checkbox" checked={Boolean(data[key])} onChange={event => setData({ ...data, [key]: event.target.checked })}/><span>{label}</span></label>;
  const section = (title: string, children: ReactNode) => <fieldset><legend>{title}</legend><div className="form-grid">{children}</div></fieldset>;
  const selectPopulation = (population: 'adult' | 'child' | 'preterm' | 'term_neonate') => { const patientGroup: PatientData['patientGroup'] = isCritical && population === 'adult' ? 'critical_adult' : isCritical && population === 'child' ? 'critical_child' : population; setData({ ...data, patientGroup, prematurityStatus: population === 'preterm' ? 'preterm' : population === 'term_neonate' ? 'term' : 'not_applicable', ageYears: population === 'preterm' || population === 'term_neonate' ? 0 : data.ageYears }); };
  const setCritical = (critical: boolean) => { const patientGroup: PatientData['patientGroup'] = critical && basePopulation === 'adult' ? 'critical_adult' : critical && basePopulation === 'child' ? 'critical_child' : basePopulation; setData({ ...data, patientGroup, clinicalStatus: critical ? 'critical' : 'stable' }); };

  return <form className="pn-form" onSubmit={event => { event.preventDefault(); onCalculate(data); }}>
    <div className="form-toolbar"><div><p className="eyebrow">Patient assessment</p><h2>Create a nutrition plan</h2></div></div>

    {section('Plan settings', <>
      <label>Guideline organization<select value={data.guidelineOrganization} onChange={event => setData({ ...data, guidelineOrganization: event.target.value })}>{availableOrganizations.map(organization => <option value={organization} key={organization}>{organization}</option>)}</select></label>
      <label>Venous access<select value={data.route} onChange={event => setData({ ...data, route: event.target.value as PatientData['route'] })}><option value="central">Central venous access</option><option value="peripheral">Peripheral venous access</option></select></label>
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
      <label>Patient population<select value={basePopulation} onChange={event => selectPopulation(event.target.value as 'adult' | 'child' | 'preterm' | 'term_neonate')}><option value="adult">Adult</option><option value="child">Child (1 month–17 years)</option><option value="preterm">Preterm neonate</option><option value="term_neonate">Term neonate</option></select></label>
      <label className="condition-toggle"><input type="checkbox" checked={isCritical || data.clinicalStatus === 'critical'} onChange={event => setCritical(event.target.checked)}/><span>Critically ill</span></label>
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

    <div className="form-submit"><button type="submit" className="primary-action">Calculate PN plan</button></div>
  </form>;
}
