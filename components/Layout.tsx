
import React, { ReactNode } from 'react';
import { useStore } from '../store/store';
import { ListIcon, BarChart3Icon, HistoryIcon, SettingsIcon } from './Icons';
import { Page } from '../types';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentPage, setCurrentPage } = useStore();

  const navItems = [
    { page: 'myLists' as Page, icon: ListIcon, label: 'Listas' },
    { page: 'statistics' as Page, icon: BarChart3Icon, label: 'Estatísticas' },
    { page: 'history' as Page, icon: HistoryIcon, label: 'Histórico' },
    { page: 'settings' as Page, icon: SettingsIcon, label: 'Ajustes' },
  ];

  return (
    <div className="flex flex-col h-screen font-sans">
      <main className="flex-1 overflow-y-auto pb-20 bg-background dark:bg-dark-background">
        {children}
      </main>
      <footer className="fixed bottom-0 left-0 right-0 bg-card dark:bg-dark-card border-t border-border dark:border-dark-border shadow-lg">
        <nav className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {navItems.map(({ page, icon: Icon, label }) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`flex flex-col items-center justify-center w-full transition-colors duration-200 ${
                currentPage === page 
                  ? 'text-primary dark:text-primary-dark' 
                  : 'text-foreground/60 dark:text-dark-foreground/60 hover:text-primary dark:hover:text-primary-dark'
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </nav>
      </footer>
    </div>
  );
};

export default Layout;
