import { TPNCalculation } from '../App';
import { Flame, Zap, Droplets, Scale } from 'lucide-react';

interface TPNResultsProps {
  calculation: TPNCalculation;
}

export function TPNResults({ calculation }: TPNResultsProps) {
  return (
    <div className="space-y-6">
      {/* Total Calories */}
      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="w-5 h-5 text-indigo-600" />
          <h3 className="text-indigo-900">Total Energy Requirements</h3>
        </div>
        <div className="text-indigo-900">{calculation.totalCalories} kcal/day</div>
      </div>

      {/* Macronutrients */}
      <div className="space-y-3">
        <h3 className="text-gray-700">Macronutrient Breakdown</h3>
        
        {/* Protein */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-700">Protein (Amino Acids)</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Amount:</span>
              <span className="text-blue-900">{calculation.proteinGrams} g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Calories:</span>
              <span className="text-blue-900">{calculation.proteinCalories} kcal</span>
            </div>
          </div>
        </div>

        {/* Dextrose */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-700">Dextrose (Carbohydrates)</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Amount:</span>
              <span className="text-green-900">{calculation.dextroseGrams} g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Calories:</span>
              <span className="text-green-900">{calculation.dextroseCalories} kcal</span>
            </div>
          </div>
        </div>

        {/* Lipids */}
        <div className="bg-amber-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-gray-700">Lipids (Fat Emulsion 20%)</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Amount:</span>
              <span className="text-amber-900">{calculation.lipidGrams} g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Calories:</span>
              <span className="text-amber-900">{calculation.lipidCalories} kcal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="space-y-3 pt-4 border-t border-gray-200">
        <h3 className="text-gray-700">Additional Metrics</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Fluid Requirement</div>
            <div className="text-gray-900">{calculation.fluidRequirement} mL/day</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Nitrogen</div>
            <div className="text-gray-900">{calculation.nitrogenGrams} g/day</div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-sm text-gray-600 mb-1">Calorie:Nitrogen Ratio</div>
          <div className="text-purple-900">{calculation.calorieToNitrogenRatio}:1</div>
          <div className="text-xs text-gray-500 mt-1">
            Target range: 100-150:1 (non-protein calories to nitrogen)
          </div>
        </div>
      </div>

      {/* Calorie Distribution */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-gray-700 mb-3">Calorie Distribution</h3>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Protein</span>
              <span className="text-gray-900">
                {Math.round((calculation.proteinCalories / calculation.totalCalories) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${(calculation.proteinCalories / calculation.totalCalories) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Dextrose</span>
              <span className="text-gray-900">
                {Math.round((calculation.dextroseCalories / calculation.totalCalories) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{ width: `${(calculation.dextroseCalories / calculation.totalCalories) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Lipids</span>
              <span className="text-gray-900">
                {Math.round((calculation.lipidCalories / calculation.totalCalories) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500"
                style={{ width: `${(calculation.lipidCalories / calculation.totalCalories) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
