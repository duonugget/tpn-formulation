import { Menu, Download, Play } from 'lucide-react';

export function Header() {
  return (
    <div>
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <span className="text-teal-600">TPN</span>
              <span className="text-green-500">Calculator</span>
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Advanced Health & Nutrition Solutions
            </div>
          </div>

          {/* Menu Button */}
          <button className="p-2 hover:bg-gray-100 rounded">
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Blue Banner */}
      <div className="bg-teal-800 text-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Left side - Title */}
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-full">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" stroke="#0D9488" strokeWidth="2"/>
                <path d="M16 8V24M8 16H24" stroke="#0D9488" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-white">Nutrinet Parenteral</h1>
              <p className="text-xs text-teal-100">Total Parenteral Nutrition Calculator</p>
            </div>
          </div>

          {/* Right side - Action Buttons */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-6 py-2 border-2 border-white text-white rounded-full hover:bg-white hover:text-teal-800 transition-colors">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">DOWNLOAD BROCHURE</span>
            </button>
            <button className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors">
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">REQUEST DEMO</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
