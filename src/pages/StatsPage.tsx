import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ModernLoginPage from '@/components/auth/ModernLoginPage';
import MainLayout from '@/components/layout/MainLayout';
import AdvancedStatsOverview from '@/components/dashboard/AdvancedStatsOverview';

const StatsPage = () => {
  const { user } = useAuth();

  if (!user) {
    return <ModernLoginPage />;
  }

  return (
    <MainLayout>
      <AdvancedStatsOverview />
    </MainLayout>
  );
};

export default StatsPage;