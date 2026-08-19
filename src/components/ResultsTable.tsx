import { useState } from 'react';
import * as XLSX from 'xlsx-js-style';
import type { PatientData, TPNResult } from '../App';

const order = ['Access & safety', 'Macronutrients & fluid', 'Electrolytes & minerals', 'Trace elements', 'Vitamins', 'Clinician-entered targets'];
const mid = (result?: TPNResult) => {
  const values = result?.value.match(/[0-9]+(?:\.[0-9]+)?/g)?.map(Number) ?? [];
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
};

export function ResultsTable({ plans, patientInfo }: { plans: TPNResult[][]; patientInfo: PatientData }) {
  const [selectedDay, setSelectedDay] = useState(0);
  const results = plans[selectedDay] ?? [];
  const groups = results.reduce<Record<string, TPNResult[]>>((all, item) => { (all[item.category] ||= []).push(item); return all; }, {});
  const planDay = `Day ${selectedDay + 1}`;
  const heightCm = patientInfo.heightInches * 2.54;
  const bmi = patientInfo.weight / Math.max(0.01, (heightCm / 100) ** 2);
  const ibw = 45.5 + (patientInfo.gender === 'male' ? 4.5 : 0) + 2.3 * Math.max(0, patientInfo.heightInches - 60);
  const population = patientInfo.patientGroup.includes('adult') ? 'Adult' : patientInfo.patientGroup.includes('child') ? 'Child' : patientInfo.patientGroup === 'preterm' ? 'Preterm neonate' : 'Term neonate';
  const isAdult = patientInfo.patientGroup.includes('adult');
  const isNeonate = patientInfo.patientGroup === 'preterm' || patientInfo.patientGroup === 'term_neonate';
  const access = patientInfo.route === 'central' ? 'Central venous access' : 'Peripheral venous access';

  const exportSolutionOne = () => {
    const find = (...names: string[]) => results.find(item => names.includes(item.element));
    const calories = mid(find('Energy')) || mid(find('Clinician Entered Energy Target'));
    const protein = mid(find('Amino Acids')) || mid(find('Clinician Entered Protein Target'));
    const lipid = mid(find('Lipid'));
    const fluid = mid(find('Fluid')) || patientInfo.weight * 35;
    const glucose = mid(find('Glucose', 'Dextrose')) || Math.max(0, (calories - protein * 4 - lipid * 9) / 3.4);
    const osmolarity = find('Estimated PN osmolarity');
    const rate = fluid / 24;
    const lipidRate = lipid / 0.2 / 24;
    const rows: (string | number)[][] = [
      ['PARENTERAL NUTRITION — SOLUTION 1'], [], ['PATIENT INFORMATION'],
      ['Population', population],
      ['Clinical status', patientInfo.clinicalStatus === 'critical' ? 'Critically ill' : 'Stable'],
      ['Age', isNeonate ? patientInfo.postnatalAgeDays ?? '' : patientInfo.ageYears, isNeonate ? 'days' : 'years'],
      ['Sex', patientInfo.gender === 'male' ? 'Male' : 'Female'],
      ['Height', isNeonate ? 'Not applicable' : patientInfo.heightInches, isNeonate ? '' : 'inches'],
      ['Current weight', patientInfo.weight, 'kg'],
      ['Body mass index', isAdult && Number.isFinite(bmi) ? bmi.toFixed(1) : 'Not applicable', isAdult ? 'kg/m²' : ''],
      ['Ideal body weight', isAdult && Number.isFinite(ibw) ? ibw.toFixed(1) : 'Not applicable', isAdult ? 'kg' : ''],
      ['Guideline', patientInfo.guidelineOrganization],
      ['Venous access', access],
      ['Plan day', selectedDay + 1], [],
      ['SOLUTION 1 — FINAL DAILY VALUES'],
      ['Component', 'Daily amount', 'Unit', 'Concentration / rate'],
      ['Total volume', fluid, 'mL/day', `${rate.toFixed(1)} mL/hr`],
      ['ESTIMATED OSMOLARITY', osmolarity?.value ?? 'Unable to estimate', osmolarity?.unit ?? '', patientInfo.route === 'peripheral' ? 'Peripheral limit: ≤900 mOsm/L' : 'Verify before compounding'],
      ['Glucose', glucose, 'g/day', `${(glucose / fluid * 100).toFixed(2)}%`],
      ['Amino acids', protein, 'g/day', `${(protein / fluid * 100).toFixed(2)}%`],
      ['Lipid 20%', lipid, 'g/day', `${lipidRate.toFixed(2)} mL/hr`],
      ['Total energy', glucose * 3.4 + protein * 4 + lipid * 9, 'kcal/day', ''],
      ['Non-protein kcal : nitrogen', (glucose * 3.4 + lipid * 9) / Math.max(0.01, protein / 6.25), ': 1', ''], [],
      ['ALL INFERRED DAILY NUTRIENTS'],
      ['Component', 'Daily value', 'Unit', 'Source'],
      ...results.filter(item => !['Plan context', 'Access & safety'].includes(item.category)).map(item => [item.element, item.value, item.unit, ''])
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 31 }, { wch: 22 }, { wch: 16 }, { wch: 34 }];
    ws['!merges'] = [XLSX.utils.decode_range('A1:D1'), XLSX.utils.decode_range('A3:D3'), XLSX.utils.decode_range('A16:D16'), XLSX.utils.decode_range('A26:D26')];
    ws['!rows'] = [{ hpt: 30 }, {}, { hpt: 23 }, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, { hpt: 26 }, { hpt: 22 }, {}, { hpt: 27 }];
    const usedRange = XLSX.utils.decode_range(ws['!ref'] ?? 'A1:D1');
    for (let row = usedRange.s.r; row <= usedRange.e.r; row++) for (let col = 0; col < 4; col++) {
      const address = XLSX.utils.encode_cell({ r: row, c: col }); const cell = ws[address] ?? (ws[address] = { t: 's', v: '' });
      cell.s = { font: { color: { rgb: '000000' } }, border: { top: { style: 'thin', color: { rgb: '000000' } }, bottom: { style: 'thin', color: { rgb: '000000' } }, left: { style: 'thin', color: { rgb: '000000' } }, right: { style: 'thin', color: { rgb: '000000' } } }, alignment: { vertical: 'center' } };
    }
    for (const row of [0, 2, 15, 25]) for (let col = 0; col < 4; col++) {
      const cell = ws[XLSX.utils.encode_cell({ r: row, c: col })];
      if (cell) cell.s = { ...cell.s, font: { bold: true, color: { rgb: '000000' }, sz: row === 0 ? 16 : 12 } };
    }
    for (const row of [16, 26]) for (let col = 0; col < 4; col++) {
      const cell = ws[XLSX.utils.encode_cell({ r: row, c: col })];
      if (cell) cell.s = { ...cell.s, font: { bold: true, color: { rgb: '000000' } } };
    }
    for (let col = 0; col < 4; col++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 18, c: col })];
      if (cell) cell.s = { ...cell.s, font: { bold: true, color: { rgb: '000000' }, sz: 12 }, border: { top: { style: 'medium', color: { rgb: '000000' } }, bottom: { style: 'medium', color: { rgb: '000000' } }, left: { style: 'medium', color: { rgb: '000000' } }, right: { style: 'medium', color: { rgb: '000000' } } } };
    }
    ws['!autofilter'] = { ref: 'A27:D27' };
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, ws, 'Solution 1');
    XLSX.writeFile(book, `TPN_Solution_1_Day_${selectedDay + 1}.xlsx`, { bookType: 'xlsx' });
  };

  return <section className="pn-results" aria-live="polite">
    <div className="result-topline"><div><p className="eyebrow">TPN formulation plan</p><h2>{planDay} PN formulation</h2><p><strong>{population} patient</strong> · {patientInfo.clinicalStatus === 'critical' ? 'Critically ill' : 'Stable'} · {patientInfo.weight} kg{isAdult ? ` · BMI ${bmi.toFixed(1)} · IBW ${ibw.toFixed(1)} kg` : ''} · {access} · {patientInfo.guidelineOrganization} guideline</p></div><div className="plan-day-badge"><span>PN PLAN</span><strong>{planDay}</strong></div></div>
    <div className="day-tabs" aria-label="PN plan days">{plans.map((_, index) => <button className={index === selectedDay ? 'active' : ''} type="button" onClick={() => setSelectedDay(index)} key={index}>Day {index + 1}</button>)}<button type="button" className="export-excel" onClick={exportSolutionOne}>Download Excel plan</button></div>
    <div className="result-body">{order.filter(name => groups[name]?.length).map(name => <section className="nutrient-section" key={name}><h3>{name}</h3><div className="table-scroll"><table className="nutrient-table"><thead><tr><th>Component</th><th>Calculated daily amount</th></tr></thead><tbody>{groups[name].map((item, index) => <tr className={item.element === 'Estimated PN osmolarity' ? 'osmolarity-row' : ''} key={`${item.element}-${index}`}><td><strong>{item.element}</strong></td><td><strong>{item.value} {item.unit}</strong></td></tr>)}</tbody></table></div></section>)}</div>
    <footer className="clinical-note">For clinical decision support only. A pharmacist must verify the final formulation, osmolarity, compatibility, venous access, and laboratory data before compounding or administration.</footer>
  </section>;
}
