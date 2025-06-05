
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff } from 'lucide-react';

const SettingsProfile: React.FC = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formData, setFormData] = useState({
    accountId: '458475591481171968',
    email: 'abhik.voice@gmail.com',
    firstName: 'A',
    lastName: 'K',
    company: '',
    mobileNumber: '(718) 406-1667',
    timeZone: 'America/New_York',
    deliverTo: 'USA',
    currentPassword: '',
    newPassword: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateDetails = () => {
    console.log('Updating details:', formData);
  };

  const handleUpdatePassword = () => {
    console.log('Updating password');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Details Section */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">Profile Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="accountId" className="text-sm font-medium text-gray-700">
                ACCOUNT ID
              </Label>
              <Input
                id="accountId"
                value={formData.accountId}
                disabled
                className="bg-gray-100 text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  EMAIL ADDRESS
                </Label>
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  EDIT
                </button>
              </div>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500">Your email address will be validated</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                FIRST NAME
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                LAST NAME
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-medium text-gray-700">
                COMPANY/GROUP
              </Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobileNumber" className="text-sm font-medium text-gray-700">
                MOBILE NUMBER
              </Label>
              <Input
                id="mobileNumber"
                value={formData.mobileNumber}
                disabled
                className="bg-gray-100 text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeZone" className="text-sm font-medium text-gray-700">
                TIME ZONE <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.timeZone} onValueChange={(value) => handleInputChange('timeZone', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">(-04:00) America/New_York</SelectItem>
                  <SelectItem value="America/Chicago">(-05:00) America/Chicago</SelectItem>
                  <SelectItem value="America/Denver">(-06:00) America/Denver</SelectItem>
                  <SelectItem value="America/Los_Angeles">(-07:00) America/Los_Angeles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliverTo" className="text-sm font-medium text-gray-700">
                DELIVER MY MESSAGES TO
              </Label>
              <Select value={formData.deliverTo} onValueChange={(value) => handleInputChange('deliverTo', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USA">USA</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="UK">UK</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleUpdateDetails}
              className="w-full bg-gray-400 hover:bg-gray-500 text-white"
            >
              UPDATE DETAILS
            </Button>
          </CardContent>
        </Card>

        {/* Change Password Section */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">Change your password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                CURRENT PASSWORD
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                NEW PASSWORD
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <Button 
              onClick={handleUpdatePassword}
              className="bg-gray-400 hover:bg-gray-500 text-white"
            >
              UPDATE PASSWORD
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsProfile;
