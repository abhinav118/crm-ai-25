
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SettingsLayout from '@/components/settings/SettingsLayout';
import SettingsProfile from './SettingsProfile';
import SettingsPlanDetails from './SettingsPlanDetails';
import SettingsNumbers from './SettingsNumbers';

const Settings: React.FC = () => {
  return (
    <SettingsLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/settings/plan-details" replace />} />
        <Route path="/plan-details" element={<SettingsPlanDetails />} />
        <Route path="/profile" element={<SettingsProfile />} />
        <Route path="/numbers" element={<SettingsNumbers />} />
      </Routes>
    </SettingsLayout>
  );
};

export default Settings;
