import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { PatientData } from '../App';

interface PatientInputProps {
  onCalculate: (data: PatientData) => void;
}

export function PatientInput({ onCalculate }: PatientInputProps) {
  const [formData, setFormData] = useState<PatientData>({
    dateOfBirth: '2005-02-12',
    weight: 55,
    isPremature: false,
    gender: 'male',
    height: 170,
    clinicalCondition: 'normal',
    stressFactor: 1.0,
    days: 7,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
          {/* Date of Birth */}
          <div>
            <label htmlFor="dob" className="block text-sm text-gray-700 mb-2">
              Date of birth (MM/dd/yyyy)
            </label>
            <input
              id="dob"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
              required
            />
          </div>

          {/* Weight */}
          <div>
            <label htmlFor="weight" className="block text-sm text-gray-700 mb-2">
              Weight:
            </label>
            <div className="flex gap-2">
              <input
                id="weight"
                type="number"
                step="0.1"
                min="0.5"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                required
              />
              <span className="px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-700">
                kg
              </span>
            </div>
          </div>

          {/* Height */}
          <div>
            <label htmlFor="height" className="block text-sm text-gray-700 mb-2">
              Height:
            </label>
            <div className="flex gap-2">
              <input
                id="height"
                type="number"
                step="0.1"
                min="30"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                required
              />
              <span className="px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-700">
                cm
              </span>
            </div>
          </div>

          {/* Number of Days */}
          <div>
            <label htmlFor="days" className="block text-sm text-gray-700 mb-2">
              Number of Days:
            </label>
            <input
              id="days"
              type="number"
              min="1"
              max="365"
              value={formData.days}
              onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
              required
            />
          </div>

          {/* Calculate Button */}
          <div>
            <button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded transition-colors flex items-center justify-center gap-2"
            >
              <Calculator className="w-4 h-4" />
              Calculate
            </button>
          </div>
        </div>

        {/* Additional Options */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          {/* Premature Checkbox */}
          <div className="flex items-center">
            <input
              id="premature"
              type="checkbox"
              checked={formData.isPremature}
              onChange={(e) => setFormData({ ...formData, isPremature: e.target.checked })}
              className="w-4 h-4 text-cyan-500 border-gray-300 rounded focus:ring-cyan-500"
            />
            <label htmlFor="premature" className="ml-2 text-sm text-gray-700">
              Premature
            </label>
          </div>

          {/* Gender */}
          <div>
            <label htmlFor="gender" className="block text-sm text-gray-700 mb-2">
              Gender:
            </label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* Clinical Condition */}
          <div>
            <label htmlFor="condition" className="block text-sm text-gray-700 mb-2">
              Clinical Condition:
            </label>
            <select
              id="condition"
              value={formData.clinicalCondition}
              onChange={(e) => {
                const condition = e.target.value;
                let stressFactor = 1.0;
                if (condition === 'minor-surgery') stressFactor = 1.2;
                else if (condition === 'infection') stressFactor = 1.4;
                else if (condition === 'sepsis') stressFactor = 1.6;
                else if (condition === 'severe-trauma') stressFactor = 1.8;
                
                setFormData({ ...formData, clinicalCondition: condition, stressFactor });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
            >
              <option value="normal">Normal</option>
              <option value="minor-surgery">Minor Surgery</option>
              <option value="infection">Infection</option>
              <option value="sepsis">Sepsis</option>
              <option value="severe-trauma">Severe Trauma</option>
            </select>
          </div>
        </div>
      </form>

      {/* Info Banner */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded p-4">
        <p className="text-sm text-blue-800">
          Click <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white rounded-full text-xs">ⓘ</span> icon for more information about a particular item in the table!
        </p>
      </div>
    </div>
  );
}