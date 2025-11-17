import React, { useEffect, useState } from 'react';
import { useStore } from './store/store';
import Layout from './components/Layout';
import WelcomeScreen from './screens/WelcomeScreen';
import SetBudgetScreen from './screens/SetBudgetScreen';
import MyListsScreen from './screens/MyListsScreen';
import ListDetailScreen from './screens/ListDetailScreen';
import StatisticsScreen from './screens/StatisticsScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import AuthScreen from './screens/AuthScreen';
import { Page } from './types';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const { currentPage, currentListId, hasSeenOnboarding, theme, session, setSession, fetchInitialData } = useStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);
  
  useEffect(() => {
    if (session) {
      fetchInitialData();
    }
  }, [session, fetchInitialData]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);
  
  const renderContent = () => {
    if (!session) {
      return <AuthScreen />;
    }

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
