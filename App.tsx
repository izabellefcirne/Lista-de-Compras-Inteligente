import React, { useEffect } from 'react';
import { useStore } from './store/store';
import Layout from './components/Layout';
import WelcomeScreen from './screens/WelcomeScreen';
import SetBudgetScreen from './screens/SetBudgetScreen';
import MyListsScreen from './screens/MyListsScreen';
import ListDetailScreen from './screens/ListDetailScreen';
import StatisticsScreen from './screens/StatisticsScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import { Page } from './types';

const App: React.FC = () => {
  const { currentPage, currentListId, hasSeenOnboarding, theme } = useStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);
  
  const renderContent = () => {
    if (!hasSeenOnboarding) {
      return <WelcomeScreen />;
    }

    const pages: Record<Page, React.ReactNode> = {
      welcome: <WelcomeScreen />,
      setBudget: <SetBudgetScreen />,
      myLists: <MyListsScreen />,
      listDetail: currentListId ? <ListDetailScreen listId={currentListId} /> : <MyListsScreen />,
      statistics: <StatisticsScreen />,
      history: <HistoryScreen />,
      settings: <SettingsScreen />,
    };

    const requiresLayout: Page[] = ['myLists', 'statistics', 'history', 'settings'];

    const pageContent = pages[currentPage] || <MyListsScreen />;

    if (requiresLayout.includes(currentPage)) {
      return <Layout>{pageContent}</Layout>;
    }
    
    return pageContent;
  };

  return <>{renderContent()}</>;
};

export default App;