import React from 'react';
import { Play } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl p-8 md:p-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rounded-full"></div>
            </div>
            <span className="text-xl font-bold text-blue-600">RESPIRE</span>
          </div>

          {/* Empty space for balance */}
          <div></div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl">
          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold text-black mb-4">
            Smart City Analytics
          </h1>
          
          {/* Sub-headline */}
          <h2 className="text-xl md:text-2xl text-black mb-8">
            Real-time Urban Planning Platform
          </h2>

          {/* Description */}
          <p className="text-gray-600 text-lg leading-relaxed mb-8 max-w-2xl">
            Monitor traffic patterns, air quality, and urban health in real-time. 
            Use our advanced simulation tools to test interventions and optimize 
            city planning decisions. Built for urban planners, city officials, 
            and environmental researchers.
          </p>

          {/* Content Indicators */}
          <div className="flex space-x-2 mb-12">
            <div className="w-3 h-3 bg-black rounded-full"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          </div>

          {/* Call-to-Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onGetStarted}
              className="bg-black text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>GET STARTED</span>
            </button>
            
            <button className="bg-white text-black border-2 border-black px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
              SEE MORE
            </button>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🌍</span>
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">Real-time Monitoring</h3>
            <p className="text-gray-600 text-sm">Live traffic and air quality data from across the city</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🧪</span>
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">What-If Simulator</h3>
            <p className="text-gray-600 text-sm">Test urban interventions and see their impact instantly</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">Analytics & Reports</h3>
            <p className="text-gray-600 text-sm">Generate comprehensive PDF reports for stakeholders</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
