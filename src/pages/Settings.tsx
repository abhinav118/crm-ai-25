
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SettingsLayout from '@/components/settings/SettingsLayout';
import SettingsProfile from './SettingsProfile';
import SettingsNumbers from './SettingsNumbers';

const Settings: React.FC = () => {
  return (
    <SettingsLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/settings/profile" replace />} />
        <Route path="/profile" element={<SettingsProfile />} />
        <Route path="/numbers" element={<SettingsNumbers />} />
      </Routes>
    </SettingsLayout>
  );
};

export default Settings;
