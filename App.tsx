
import React, { useState } from 'react';
import SgpaCalculator from './components/SgpaCalculator';
import SgpaPredictor from './components/SgpaPredictor';
import { CalculatorIcon, ChartBarIcon } from './components/icons';

type Mode = 'select' | 'calculate' | 'predict';

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>('select');

  const renderContent = () => {
    switch (mode) {
      case 'calculate':
        return <SgpaCalculator onBack={() => setMode('select')} />;
      case 'predict':
        return <SgpaPredictor onBack={() => setMode('select')} />;
      case 'select':
      default:
        return (
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <ModeCard
              title="SGPA Calculator"
              description="Calculate your SGPA based on your final marks and component weightages."
              icon={<CalculatorIcon />}
              onClick={() => setMode('calculate')}
            />
            <ModeCard
              title="SGPA Predictor"
              description="Predict the marks you need in future assessments to achieve a desired SGPA."
              icon={<ChartBarIcon />}
              onClick={() => setMode('predict')}
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-5xl text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">
          SGPA Genius
        </h1>
        <p className="text-slate-400 mt-2">Your Academic Performance Navigator</p>
      </header>
      <main className="w-full max-w-5xl">
        {renderContent()}
      </main>
      <footer className="w-full max-w-5xl text-center mt-12 text-slate-500 text-sm">
        <p>Built with React, TypeScript, and Tailwind CSS</p>
      </footer>
    </div>
  );
};

interface ModeCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const ModeCard: React.FC<ModeCardProps> = ({ title, description, icon, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full md:w-80 h-80 p-6 bg-slate-800 border border-slate-700 rounded-lg shadow-lg hover:bg-slate-700 hover:border-blue-500 transition-all duration-300 flex flex-col items-center justify-center text-center group"
    >
      <div className="text-blue-400 group-hover:text-blue-300 transition-colors mb-4">
        {icon}
      </div>
      <h2 className="text-2xl font-semibold text-slate-100 mb-2">{title}</h2>
      <p className="text-slate-400">{description}</p>
    </button>
  );
};

export default App;
