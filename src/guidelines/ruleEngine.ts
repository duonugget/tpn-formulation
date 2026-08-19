import type { InferenceStep, PatientData, TPNResult } from '../App';

type Rule = { rule_id: string; priority?: number; logic: any; action: any; source: { document_id: string; organization?: string; location: string; text: string }; quality: any };
type Target = { variable: string; min: number; max: number; unit: string; type: string; source: string; detail: string; priority: number };
const modules = import.meta.glob('./rules/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;
const isRule = (value: unknown): value is Rule => Boolean(value && typeof value === 'object' && 'rule_id' in value && 'logic' in value && 'action' in value && 'source' in value && 'quality' in value);
const rules = Object.entries(modules).filter(([path]) => !path.endsWith('/tpn_compact_temporal_rules.json')).flatMap(([, module]) => (Array.isArray(module) ? module : (module as { rules?: unknown[] })?.rules ?? []).filter(isRule));
export const availableOrganizations = [...new Set(
  rules.map(rule => rule.source.organization).filter((organization): organization is string => Boolean(organization) && organization !== 'UNKNOWN' && organization !== 'OTHER')
)].sort();
const round = (n: number) => Number.isFinite(n) ? n.toFixed(1) : '—';
const title = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

function unwrap(value: any) { if (!value || typeof value !== 'object') return value; if ('value' in value) return value.value; if ('text' in value) return value.text; if (Array.isArray(value.includes) && value.includes.length === 1) return value.includes[0]; return value; }
function matches(node: any, context: Record<string, unknown>): boolean {
  if (node.operator === 'AND') return node.rules.every((rule: any) => matches(rule, context));
  if (node.operator === 'OR') return node.rules.some((rule: any) => matches(rule, context));
  if (node.operator === 'NOT') return !matches(node.rule, context);
  const left = context[node.variable]; const right = unwrap(node.value); const leftValues = Array.isArray(left) ? left : [left]; const primaryLeft = leftValues[0];
  if (node.operator === 'is_null') return leftValues.every(value => value === null || value === undefined || value === '' || value === 'unknown' || value === false);
  if (node.operator === 'is_not_null') return leftValues.some(value => value !== null && value !== undefined && value !== '' && value !== 'unknown' && value !== false);
  if (left === undefined || left === null) return false;
  const equal = node.variable === 'prematurity_status' && right === true ? leftValues.includes('preterm') : leftValues.some(value => String(value) === String(right));
  const range = Array.isArray(right) ? right : node.value?.min !== undefined ? [node.value.min, node.value.max] : [];
  switch (node.operator) { case '==': return equal; case '!=': return !equal; case '>': return Number(primaryLeft) > Number(right); case '>=': return Number(primaryLeft) >= Number(right); case '<': return Number(primaryLeft) < Number(right); case '<=': return Number(primaryLeft) <= Number(right); case 'between': return Number(primaryLeft) >= Number(range[0]) && Number(primaryLeft) <= Number(range[1]); case 'in': return Array.isArray(right) && leftValues.some(value => right.some(candidate => String(candidate) === String(value))); case 'not_in': return Array.isArray(right) && leftValues.every(value => !right.some(candidate => String(candidate) === String(value))); default: return false; }
}

function matchesWithoutTime(node: any, context: Record<string, unknown>): boolean {
  if (node.operator === 'AND') return node.rules.every((rule: any) => matchesWithoutTime(rule, context));
  if (node.operator === 'OR') return node.rules.some((rule: any) => matchesWithoutTime(rule, context));
  if (node.operator === 'NOT') return !matchesWithoutTime(node.rule, context);
  return ['days_since_pn_start', 'pn_day'].includes(node.variable) ? true : matches(node, context);
}

type ResolvedValue = { min: number; max: number; unit: string };

function temporalDay(marker: unknown): number | null {
  if (typeof marker === 'number' && Number.isFinite(marker)) return marker;
  const text = String(marker ?? '').trim().toLowerCase();
  if (/^(start|day\s*1|from the outset|outset)$/.test(text)) return 1;
  const number = Number(text.match(/\d+(?:\.\d+)?/)?.[0]);
  if (!Number.isFinite(number)) return null;
  if (/\bafter\b/.test(text)) return Math.floor(number) + 1;
  if (/\b(day|days|over|until|up to|through)\b/.test(text)) return Math.max(1, Math.floor(number));
  return null;
}

function resolveSchedule(schedule: any[], day: number, inheritedUnit = ''): ResolvedValue | null {
  const anchors = schedule.map(entry => ({ entry, day: temporalDay(entry.from) }))
    .filter((anchor): anchor is { entry: any; day: number } => anchor.day !== null)
    .sort((a, b) => a.day - b.day);
  if (!anchors.length) return schedule.length === 1 ? resolveValue(schedule[0].value, day, inheritedUnit) : null;

  const first = anchors[0];
  if (day <= first.day) return resolveValue(first.entry.value, day, inheritedUnit);
  for (let index = 0; index < anchors.length - 1; index++) {
    const current = anchors[index]; const next = anchors[index + 1];
    if (day > next.day) continue;
    const from = resolveValue(current.entry.value, day, inheritedUnit);
    const to = resolveValue(next.entry.value, day, inheritedUnit);
    if (!from || !to || (from.unit && to.unit && from.unit !== to.unit)) return from;
    const progress = Math.max(0, Math.min(1, (day - current.day) / Math.max(1, next.day - current.day)));
    return { min: from.min + (to.min - from.min) * progress, max: from.max + (to.max - from.max) * progress, unit: to.unit || from.unit };
  }
  return resolveValue(anchors.at(-1)!.entry.value, day, inheritedUnit);
}

function resolveValue(value: any, day: number, inheritedUnit = ''): ResolvedValue | null {
  if (value?.type === 'TIME_VARYING' && Array.isArray(value.schedule)) return resolveSchedule(value.schedule, day, value.unit ?? inheritedUnit);
  if (typeof value?.exact === 'number') return { min: value.exact, max: value.exact, unit: value.unit ?? inheritedUnit };
  if (typeof value?.min === 'number' && typeof value?.max === 'number') return { min: value.min, max: value.max, unit: value.unit ?? inheritedUnit };
  return null;
}

function resolveActionValue(action: any, day: number): ResolvedValue | null {
  if (Array.isArray(action?.temporal?.schedule)) {
    const scheduled = resolveSchedule(action.temporal.schedule, day, action.value?.unit ?? '');
    if (scheduled) return scheduled;
  }
  return resolveValue(action?.value, day);
}

function category(variable: string) { if (['energy', 'amino_acids', 'dextrose', 'glucose', 'glucose_infusion_rate', 'lipid', 'fluid'].includes(variable)) return 'Macronutrients & fluid'; if (['sodium', 'potassium', 'calcium', 'magnesium', 'phosphate', 'chloride', 'acetate'].includes(variable)) return 'Electrolytes & minerals'; if (['zinc', 'copper', 'manganese', 'selenium', 'chromium', 'iron', 'iodine', 'molybdenum'].includes(variable)) return 'Trace elements'; return 'Vitamins'; }
function directValue(target: Target, weight: number) { let min = target.min, max = target.max, unit = target.unit; if (unit.includes('/kg/min')) { min *= weight * 1.44; max *= weight * 1.44; unit = 'g/day'; } else if (unit.includes('/kg')) { min *= weight; max *= weight; unit = unit.replace('/kg', ''); } return { value: target.type === 'SET_MAX' ? `≤ ${round(max)}` : target.type === 'SET_MIN' ? `≥ ${round(min)}` : min === max ? round(min) : `${round(min)}–${round(max)}`, unit }; }
function dailyRange(target: Target | undefined, weight: number): { min: number; max: number } | null {
  if (!target) return null;
  let { min, max } = target;
  if (target.type === 'SET_MIN' || (max >= 999 && min < max)) max = min;
  if (target.type === 'SET_MAX') min = max;
  if (target.unit.includes('/kg/min')) { min *= weight * 1.44; max *= weight * 1.44; }
  else if (target.unit.includes('/kg')) { min *= weight; max *= weight; }
  return Number.isFinite(min) && Number.isFinite(max) ? { min, max } : null;
}
function fallbackTargets(data: PatientData): Target[] {
  const neonatal = data.prematurityStatus === 'preterm' || data.prematurityStatus === 'term';
  const child = data.ageYears < 18;
  const early = data.days <= 4;
  const energy = neonatal ? (early ? [45, 60] : [80, 90]) : child ? [90, 120] : [20, 30];
  const amino = data.prematurityStatus === 'preterm' ? (early ? [1.5, 2] : [3, 4]) : data.prematurityStatus === 'term' ? (early ? [1, 2] : [2.5, 3]) : child ? [1, 2] : [0.8, 1.5];
  const lipid = neonatal ? (early ? [1, 2] : data.prematurityStatus === 'preterm' ? [3, 4] : [2.5, 3]) : [1, 1];
  const entries: Array<[string, number, number, string]> = [['energy', energy[0], energy[1], 'kcal/kg/day'], ['amino_acids', amino[0], amino[1], 'g/kg/day'], [neonatal ? 'glucose' : 'dextrose', neonatal ? (early ? 6 : 9) : 4, neonatal ? (early ? 9 : 16) : 5, neonatal ? 'g/kg/day' : 'mg/kg/min'], ['lipid', lipid[0], lipid[1], 'g/kg/day'], ['fluid', child ? 50 : 30, child ? 120 : 40, 'mL/kg/day'], ['sodium', 1, 2, 'mEq/kg/day'], ['potassium', 1, 2, 'mEq/kg/day'], ['calcium', child ? 0.25 : 10, child ? 0.4 : 15, child ? 'mmol/kg/day' : 'mg/kg/day'], ['magnesium', child ? 0.1 : 8, child ? 0.3 : 20, child ? 'mmol/kg/day' : 'mg/kg/day'], ['phosphate', child ? 0.2 : 20, child ? 0.7 : 40, child ? 'mmol/kg/day' : 'mmol/day']];
  return entries.map(([variable, min, max, unit]) => ({ variable, min, max, unit, type: 'SET_RANGE', source: 'TPN_rules.docx · default profile', detail: 'Default profile used because no patient-specific numeric rule matched; review and individualize.', priority: 10000 }));
}

export function evaluateRules(data: PatientData, previousPlan: TPNResult[] = []): { results: TPNResult[]; appliedRules: Rule[]; mermaid: string; trace: InferenceStep[] } {
  const heightCm = data.heightInches * 2.54; const ibw = 45.5 + (data.gender === 'male' ? 4.5 : 0) + 2.3 * Math.max(0, data.heightInches - 60); const bmi = data.weight / ((heightCm / 100) ** 2);
  const clinicalStatuses = [data.clinicalStatus, data.ageYears >= 18 ? (data.clinicalStatus === 'critical' ? 'Critically Ill Adult' : 'Adult') : data.clinicalStatus === 'critical' ? 'critically_ill_trauma_sepsis' : 'stable'];
  if (data.clinicalStatus === 'critical' || data.sepsis || data.trauma) clinicalStatuses.push('critically_ill_trauma_sepsis');
  if (data.dialysis) clinicalStatuses.push('on_dialysis'); if (data.hepaticStress) clinicalStatuses.push('stressed'); if (data.hepaticDisease) clinicalStatuses.push('Hepatic Disease');
  const context = { days_since_pn_start: data.days, pn_day: data.days, age_years: data.ageYears, age_days: data.postnatalAgeDays, age_months: data.ageMonths, birth_weight_kg: data.birthWeightKg, weight_kg: data.weight, blood_glucose: data.hyperglycemia ? 'hyperglycemia' : data.bloodGlucose, serum_phosphate: data.serumPhosphate, serum_triglycerides: data.serumTriglycerides, prematurity_status: data.prematurityStatus, clinical_status: clinicalStatuses, renal_disease: data.renalDisease, hepatic_disease: data.hepaticDisease, sepsis: data.sepsis, cholestasis: data.cholestasis };
  const organizationRules = data.guidelineOrganization === 'ALL' ? rules : rules.filter(rule => rule.source.organization === data.guidelineOrganization);
  const appliedRules: Rule[] = []; const targets: Target[] = []; const trace: InferenceStep[] = [];
  for (const rule of organizationRules) { const matched = matches(rule.logic, context); const value = resolveActionValue(rule.action, data.days); trace.push({ source: rule.source.organization ?? rule.source.document_id, ruleId: rule.rule_id, title: rule.source.text, matched, conditions: [], outputs: value ? [`${rule.action.variable}: ${value.min}–${value.max} ${value.unit}`] : [] }); if (matched && value) { appliedRules.push(rule); targets.push({ variable: rule.action.variable, min: value.min, max: value.max, unit: value.unit, type: rule.action.type, source: `${rule.source.organization ?? 'Unspecified'} · ${rule.source.document_id} · ${rule.source.location}`, detail: rule.source.text, priority: Number(rule.priority ?? 999) }); } }
  const exactVariables = new Set(targets.map(target => target.variable));
  for (const rule of organizationRules) {
    if (exactVariables.has(rule.action.variable) || !matchesWithoutTime(rule.logic, context)) continue;
    const value = resolveActionValue(rule.action, data.days);
    if (value) targets.push({ variable: rule.action.variable, min: value.min, max: value.max, unit: value.unit, type: rule.action.type, source: `${rule.source.organization ?? 'Unspecified'} · ${rule.source.document_id} · ${rule.source.location}`, detail: `${rule.source.text} (default/last scheduled value)`, priority: Number(rule.priority ?? 999) });
  }
  const configuredVariables = new Set(targets.map(target => target.variable));
  for (const fallback of fallbackTargets(data)) if (!configuredVariables.has(fallback.variable)) targets.push(fallback);
  const selected = targets.sort((a, b) => a.priority - b.priority).map(target => target.variable === 'dextrose' ? { ...target, variable: 'glucose' } : target).filter((item, index, all) => all.findIndex(other => other.variable === item.variable) === index);
  const fluidTarget = selected.find(target => target.variable === 'fluid');
  const guidelineFluid = dailyRange(fluidTarget, data.weight);
  if (data.fluidRestricted && data.fluidRestrictionMl && data.fluidRestrictionMl > 0 && fluidTarget && (!guidelineFluid || data.fluidRestrictionMl < guidelineFluid.max)) {
    fluidTarget.min = data.fluidRestrictionMl; fluidTarget.max = data.fluidRestrictionMl; fluidTarget.unit = 'mL/day';
    fluidTarget.detail = 'Daily volume limited by the entered fluid restriction.';
  }
  const estimateOsmolarity = () => {
    const findTarget = (name: string) => selected.find(target => target.variable === name);
    const fluid = dailyRange(findTarget('fluid'), data.weight); const amino = dailyRange(findTarget('amino_acids'), data.weight); const glucose = dailyRange(findTarget('glucose') ?? findTarget('dextrose'), data.weight); const lipid = dailyRange(findTarget('lipid'), data.weight);
    return fluid && amino && glucose ? { min: (glucose.min * 5 + amino.min * 10 + (lipid?.min ?? 0) * 0.28) / Math.max(0.001, fluid.max / 1000), max: (glucose.max * 5 + amino.max * 10 + (lipid?.max ?? 0) * 0.28) / Math.max(0.001, fluid.min / 1000) } : null;
  };
  const initialOsmolarity = estimateOsmolarity();
  const peripheralScale = data.route === 'peripheral' && initialOsmolarity && initialOsmolarity.max > 900 ? 900 / initialOsmolarity.max : 1;
  if (peripheralScale < 1) for (const target of selected) if (['energy', 'amino_acids', 'glucose', 'dextrose', 'lipid'].includes(target.variable)) { target.min *= peripheralScale; target.max *= peripheralScale; target.detail = 'Adjusted proportionally to keep estimated peripheral PN osmolarity at or below 900 mOsm/L.'; }
  const results: TPNResult[] = [{ element: 'Patient context', value: `${data.weight} kg · BMI ${round(bmi)} · IBW ${round(ibw)} kg`, unit: '', category: 'Plan context', source: 'Entered patient data' }];
  for (const target of selected) { const direct = directValue(target, data.weight); results.push({ element: title(target.variable), value: direct.value, unit: direct.unit, category: category(target.variable), source: target.source, detail: target.detail }); }
  const existingElements = new Set(results.map(result => result.element));
  for (const prior of previousPlan) {
    if (prior.category === 'Plan context' || prior.category === 'Access & safety' || existingElements.has(prior.element)) continue;
    results.push({ ...prior, source: `${prior.source ?? 'Prior-day rule'} · carried forward`, detail: `${prior.detail ?? 'No new day-specific rule matched.'} Carried forward from the previous PN day.` });
  }
  const find = (name: string) => selected.find(target => target.variable === name); const fluid = find('fluid'); const amino = find('amino_acids'); const glucose = find('glucose'); const lipid = find('lipid');
  const fluidDaily = dailyRange(fluid, data.weight); const aminoDaily = dailyRange(amino, data.weight); const glucoseDaily = dailyRange(glucose, data.weight); const lipidDaily = dailyRange(lipid, data.weight);
  const osmolarity = fluidDaily && aminoDaily && glucoseDaily ? {
    min: (glucoseDaily.min * 5 + aminoDaily.min * 10 + (lipidDaily?.min ?? 0) * 0.28) / Math.max(0.001, fluidDaily.max / 1000),
    max: (glucoseDaily.max * 5 + aminoDaily.max * 10 + (lipidDaily?.max ?? 0) * 0.28) / Math.max(0.001, fluidDaily.min / 1000)
  } : null;
  results.push({ element: 'Estimated PN osmolarity', value: osmolarity ? `${round(osmolarity.min)}–${round(osmolarity.max)}` : 'Unable to estimate', unit: osmolarity ? 'mOsm/L' : '', category: 'Access & safety', source: 'ASPEN PN macronutrient osmolarity factors', detail: 'Estimated from dextrose (5 mOsm/g), amino acids (10 mOsm/g), lipid emulsion (0.28 mOsm/g), and planned fluid volume. This is a macronutrient estimate only; electrolytes, vitamins, trace elements, medication additives, and product-specific displacement must be included in the final pharmacy calculation.' });
  if (!selected.length) results.push({ element: 'No numeric plan inferred', value: 'No rules_final rule matched the supplied patient context and day.', unit: '', category: 'Macronutrients & fluid', source: 'rules_final.json' });
  return { results, appliedRules, mermaid: '', trace };
}
export default evaluateRules;
