
import React from 'react';
import { useStore } from '../store/store';
import { CheckCircle2 } from '../components/Icons';

const WelcomeScreen: React.FC = () => {
  const { setHasSeenOnboarding, setCurrentPage } = useStore();

  const handleStart = () => {
    setHasSeenOnboarding(true);
    setCurrentPage('setBudget');
  };

  const features = [
    "Crie listas de compras personalizadas",
    "Controle seu orçamento mensalmente",
    "Acompanhe o histórico de preços",
    "Visualize estatísticas de gastos"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900 flex flex-col justify-center items-center p-6 text-center animate-fade-in">
      <div className="max-w-lg">
        <h1 className="text-4xl md:text-5xl font-extrabold text-primary dark:text-primary-dark mb-4">
          Lista de Compras Inteligente 2.0
        </h1>
        <p className="text-lg text-foreground/80 dark:text-dark-foreground/80 mb-8">
          Sua nova forma de organizar compras e finanças.
        </p>
        
        <div className="bg-card dark:bg-dark-card rounded-lg p-6 shadow-md mb-10 text-left space-y-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start animate-slide-in-up" style={{ animationDelay: `${index * 100}ms` }}>
              <CheckCircle2 className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1" />
              <span className="text-card-foreground dark:text-dark-card-foreground">{feature}</span>
            </div>
          ))}
        </div>
        
        <button
          onClick={handleStart}
          className="w-full md:w-auto px-12 py-4 bg-primary dark:bg-primary-dark text-primary-foreground text-lg font-bold rounded-full shadow-lg hover:opacity-90 transition-opacity transform hover:scale-105"
        >
          Começar
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
