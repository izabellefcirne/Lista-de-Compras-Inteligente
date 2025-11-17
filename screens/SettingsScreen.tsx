import React from 'react';
import { useStore } from '../store/store';
import { Theme } from '../types';
import { SunIcon, MoonIcon, LogOutIcon } from '../components/Icons';
import { Spinner } from '../components/Spinner';

const SettingsScreen: React.FC = () => {
  const { theme, setTheme, setCurrentPage, signOut, session, loadingStates } = useStore();

  return (
    <div className="p-4 md:p-6 animate-slide-in-up">
      <h1 className="text-2xl font-bold mb-6">Ajustes</h1>

      <div className="space-y-6">
        <div className="bg-card dark:bg-dark-card p-4 rounded-lg shadow-md">
          <h2 className="font-semibold mb-1">Conta</h2>
          <p className="text-sm text-foreground/70 dark:text-dark-foreground/70 mb-3">
            Você está logado como: <strong>{session?.user?.email}</strong>
          </p>
          <button
            onClick={signOut}
            disabled={loadingStates['signOut']}
            className="w-full flex items-center justify-center gap-2 mt-3 py-3 text-red-600 dark:text-red-500 bg-red-500/10 font-semibold rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            {loadingStates['signOut'] ? <Spinner className="w-5 h-5"/> : <><LogOutIcon className="w-5 h-5"/> Sair</>}
          </button>
        </div>

        <div className="bg-card dark:bg-dark-card p-4 rounded-lg shadow-md">
          <h2 className="font-semibold mb-3">Tema do Aplicativo</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-md border-2 transition-colors ${
                theme === 'light' ? 'border-primary dark:border-primary-dark bg-primary/10' : 'border-border dark:border-dark-border'
              }`}
            >
              <SunIcon className="w-5 h-5" />
              Claro
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-md border-2 transition-colors ${
                theme === 'dark' ? 'border-primary dark:border-primary-dark bg-primary/10' : 'border-border dark:border-dark-border'
              }`}
            >
              <MoonIcon className="w-5 h-5" />
              Escuro
            </button>
          </div>
        </div>

        <div className="bg-card dark:bg-dark-card p-4 rounded-lg shadow-md">
          <h2 className="font-semibold mb-3">Orçamento</h2>
           <button
            onClick={() => setCurrentPage('setBudget')}
            className="w-full mt-3 py-3 text-white bg-primary dark:bg-primary-dark font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Definir Orçamento Mensal
          </button>
        </div>

        {/* Placeholder for more settings */}
        <div className="bg-card dark:bg-dark-card p-4 rounded-lg shadow-md opacity-50">
          <h2 className="font-semibold mb-3">Notificações (em breve)</h2>
          <p className="text-sm text-foreground/70 dark:text-dark-foreground/70">
            Receba lembretes sobre suas listas e ofertas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
