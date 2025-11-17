
import React, { useState, useEffect } from 'react';
import { useStore } from '../store/store';
import { Budget } from '../types';

const SetBudgetScreen: React.FC = () => {
  const { budgets, setMonthlyBudget, setCurrentPage } = useStore();
  const [budget, setBudget] = useState('');
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);

  useEffect(() => {
    const now = new Date();
    const existingBudget = budgets.find(b => b.year === now.getFullYear() && b.month === now.getMonth());
    if (existingBudget) {
      setCurrentBudget(existingBudget);
      setBudget(existingBudget.amount.toString());
    }
  }, [budgets]);

  const handleSetBudget = () => {
    const amount = parseFloat(budget);
    if (!isNaN(amount) && amount > 0) {
      setMonthlyBudget(amount, new Date());
      setCurrentPage('myLists');
    } else {
      alert('Por favor, insira um valor válido para o orçamento.');
    }
  };

  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

  return (
    <div className="p-4 md:p-6 animate-slide-in-up">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Orçamento Mensal</h1>
        <p className="text-foreground/70 dark:text-dark-foreground/70 mb-6">
          Defina seu orçamento de compras para o mês de {currentMonthName}.
        </p>

        {currentBudget && (
          <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">Orçamento já definido!</strong>
            <span className="block sm:inline ml-1">
              O orçamento para este mês é de R$ {currentBudget.amount.toFixed(2)}. Você pode atualizá-lo abaixo.
            </span>
          </div>
        )}

        <div className="bg-card dark:bg-dark-card p-6 rounded-lg shadow-md">
          <label htmlFor="budget" className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-2">
            Valor do Orçamento (R$)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-foreground/50 dark:text-dark-foreground/50">R$</span>
            <input
              type="number"
              id="budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Ex: 500.00"
              className="w-full pl-10 p-3 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-md focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark focus:border-transparent transition"
            />
          </div>

          <button
            onClick={handleSetBudget}
            className="w-full mt-6 py-3 bg-primary dark:bg-primary-dark text-primary-foreground font-bold rounded-lg shadow-md hover:opacity-90 transition-opacity"
          >
            {currentBudget ? 'Atualizar Orçamento' : 'Salvar e ir para Minhas Listas'}
          </button>
          
          <button
            onClick={() => setCurrentPage('myLists')}
            className="w-full mt-3 py-2 text-primary dark:text-primary-dark font-semibold rounded-lg hover:bg-primary/10 transition-colors"
          >
            Pular por agora
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetBudgetScreen;
