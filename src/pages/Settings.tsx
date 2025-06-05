
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SettingsLayout from '@/components/settings/SettingsLayout';
import SettingsProfile from './SettingsProfile';
import SettingsPlanDetails from './SettingsPlanDetails';

const Settings: React.FC = () => {
  return (
    <SettingsLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/settings/plan-details" replace />} />
        <Route path="/plan-details" element={<SettingsPlanDetails />} />
        <Route path="/profile" element={<SettingsProfile />} />
        <Route path="/billing" element={<div className="p-6"><h1>Billing Settings</h1><p>Coming soon...</p></div>} />
        <Route path="/notifications" element={<div className="p-6"><h1>Notification Settings</h1><p>Coming soon...</p></div>} />
        <Route path="/api" element={<div className="p-6"><h1>API Settings</h1><p>Coming soon...</p></div>} />
        <Route path="/teammates" element={<div className="p-6"><h1>Teammates</h1><p>Coming soon...</p></div>} />
        <Route path="/textable-numbers" element={<div className="p-6"><h1>Textable Numbers</h1><p>Coming soon...</p></div>} />
      </Routes>
    </SettingsLayout>
  );
};

export default Settings;
