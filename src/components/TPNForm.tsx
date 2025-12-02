import { useState } from 'react';
import { Calculator, RotateCcw } from 'lucide-react';
import { PatientData } from '../App';

interface TPNFormProps {
  onCalculate: (data: PatientData) => void;
  onReset: () => void;
}

export function TPNForm({ onCalculate, onReset }: TPNFormProps) {
  const [formData, setFormData] = useState<PatientData>({
    weight: 70,
    height: 170,
    age: 50,
    gender: 'male',
    activityFactor: 1.2,
    stressFactor: 1.0,
    proteinRequirement: 1.2,
  });

  const handleChange = (field: keyof PatientData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate(formData);
  };

  const handleResetForm = () => {
    setFormData({
      weight: 70,
      height: 170,
      age: 50,
      gender: 'male',
      activityFactor: 1.2,
      stressFactor: 1.0,
      proteinRequirement: 1.2,
    });
    onReset();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-gray-700">Basic Information</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="weight" className="block text-sm text-gray-600 mb-1">
              Weight (kg) *
            </label>
            <input
              id="weight"
              type="number"
              step="0.1"
              min="1"
              required
              value={formData.weight}
              onChange={(e) => handleChange('weight', parseFloat(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label htmlFor="height" className="block text-sm text-gray-600 mb-1">
              Height (cm) *
            </label>
            <input
              id="height"
              type="number"
              step="0.1"
              min="1"
              required
              value={formData.height}
              onChange={(e) => handleChange('height', parseFloat(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="age" className="block text-sm text-gray-600 mb-1">
              Age (years) *
            </label>
            <input
              id="age"
              type="number"
              min="1"
              max="120"
              required
              value={formData.age}
              onChange={(e) => handleChange('age', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm text-gray-600 mb-1">
              Gender *
            </label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clinical Factors */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <h3 className="text-gray-700">Clinical Factors</h3>

        <div>
          <label htmlFor="activityFactor" className="block text-sm text-gray-600 mb-1">
            Activity Factor
          </label>
          <select
            id="activityFactor"
            value={formData.activityFactor}
            onChange={(e) => handleChange('activityFactor', parseFloat(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
            <option value="1.0">Bed rest (1.0)</option>
            <option value="1.2">Sedentary (1.2)</option>
            <option value="1.3">Light activity (1.3)</option>
            <option value="1.5">Moderate activity (1.5)</option>
            <option value="1.7">Active (1.7)</option>
          </select>
        </div>

        <div>
          <label htmlFor="stressFactor" className="block text-sm text-gray-600 mb-1">
            Stress Factor
          </label>
          <select
            id="stressFactor"
            value={formData.stressFactor}
            onChange={(e) => handleChange('stressFactor', parseFloat(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
            <option value="1.0">No stress (1.0)</option>
            <option value="1.2">Minor surgery (1.2)</option>
            <option value="1.3">Major surgery (1.3)</option>
            <option value="1.5">Infection (1.5)</option>
            <option value="1.6">Sepsis (1.6)</option>
            <option value="1.8">Severe sepsis/trauma (1.8)</option>
            <option value="2.0">Burns (2.0)</option>
          </select>
        </div>

        <div>
          <label htmlFor="proteinRequirement" className="block text-sm text-gray-600 mb-1">
            Protein Requirement (g/kg/day)
          </label>
          <select
            id="proteinRequirement"
            value={formData.proteinRequirement}
            onChange={(e) => handleChange('proteinRequirement', parseFloat(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
            <option value="0.8">Maintenance (0.8)</option>
            <option value="1.0">Normal (1.0)</option>
            <option value="1.2">Moderate stress (1.2)</option>
            <option value="1.5">High stress (1.5)</option>
            <option value="2.0">Severe stress/burns (2.0)</option>
            <option value="2.5">Critical illness (2.5)</option>
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
        >
          <Calculator className="w-4 h-4" />
          Calculate
        </button>
        <button
          type="button"
          onClick={handleResetForm}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>
    </form>
  );
}
