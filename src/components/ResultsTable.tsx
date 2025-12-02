import { Download, Info } from 'lucide-react';
import { TPNResult, PatientData } from '../App';
import * as XLSX from 'xlsx';

interface ResultsTableProps {
  results: TPNResult[];
  patientInfo: PatientData;
  days: number;
}

export function ResultsTable({ results, patientInfo, days }: ResultsTableProps) {
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

  const exportToExcel = () => {
    // Patient Information
    const patientData = [
      ['PARENTERAL NUTRITION SOLUTION'],
      [''],
      ['Patient Information'],
      ['Date of Birth:', patientInfo.dateOfBirth],
      ['Age:', `${calculateAge(patientInfo.dateOfBirth)} years`],
      ['Weight:', `${patientInfo.weight} kg`],
      ['Height:', `${patientInfo.height} cm`],
      ['Gender:', patientInfo.gender],
      ['Premature:', patientInfo.isPremature ? 'Yes' : 'No'],
      ['Clinical Condition:', patientInfo.clinicalCondition],
      ['Number of Days:', `${days}`],
      [''],
      ['Nutritional Requirements'],
      ['Element', 'Daily Value', 'Unit', 'Total Value'],
    ];

    // Add results
    results.forEach(result => {
      const dailyVal = result.dailyValue !== undefined ? result.dailyValue.toString() : result.value.split(' / ')[0];
      const totalVal = result.totalValue !== undefined ? result.totalValue.toString() : result.value.split(' / ')[1] || dailyVal;
      const unit = result.unit.replace(' / Total', '').replace('/day', '');
      patientData.push([result.element, dailyVal, unit, totalVal]);
    });

    // Create workbook
    const ws = XLSX.utils.aoa_to_sheet(patientData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TPN Calculation');

    // Style the header
    ws['!cols'] = [
      { wch: 35 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 }
    ];

    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    const filename = `TPN_Calculation_${days}days_${date}.xlsx`;

    // Download
    XLSX.writeFile(wb, filename);
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, TPNResult[]>);

  const categories = ['Energy', 'Fluids', 'Macronutrients', 'Electrolytes', 'Trace Elements', 'Vitamins'];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header with Export Button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-gray-900">Calculation Results</h2>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
        >
          <Download className="w-4 h-4" />
          Export to Excel
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="px-6 py-3 text-left">Element</th>
              <th className="px-6 py-3 text-left">Daily / Total for {days} day{days !== 1 ? 's' : ''}</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => {
              if (!groupedResults[category] || groupedResults[category].length === 0) return null;
              
              return (
                <React.Fragment key={category}>
                  {/* Category Header */}
                  <tr className="bg-gray-100">
                    <td colSpan={2} className="px-6 py-2 text-gray-900">
                      {category}
                    </td>
                  </tr>
                  {/* Category Items */}
                  {groupedResults[category].map((result, index) => (
                    <tr 
                      key={`${category}-${index}`}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900">{result.element}</span>
                          <button 
                            className="text-blue-600 hover:text-blue-700"
                            title="More information"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-gray-900">
                        {result.value} {result.unit}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Note */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          <strong>Note:</strong> These calculations are based on standard formulas and should be adjusted based on individual patient needs, 
          laboratory values, and clinical judgment. Always consult with a qualified healthcare professional.
        </p>
      </div>
    </div>
  );
}

// React Fragment support
import React from 'react';