
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CreditCard, Hash, Phone } from 'lucide-react';

const SettingsPlanDetails: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Your Current Plan</h1>

      {/* Current Plan Section */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Calendar className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Your plan: Free Trial</h3>
                <p className="text-sm text-gray-500">You will be charged for your plan on 06-17-2025.</p>
                <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-700 text-sm">
                  CHANGE PLAN
                </Button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold text-gray-900">$0.00/month</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credits Section */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Credits</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Monthly Credits:</strong> 120 (120 left)</p>
                  <p><strong>Anytime Credits:</strong> 0 left</p>
                  <p className="text-xs text-gray-500">Monthly credits expire at the end of each billing period and do not rollover</p>
                  <p className="text-xs text-gray-500">SMS costs 1 credit per message. MMS costs 3 credits per message.</p>
                </div>
                <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-700 text-sm mt-2">
                  BUY ANYTIME CREDITS
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keywords Section */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Hash className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Keywords</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Included Keywords:</strong> 0 (0 used)</p>
                  <p><strong>Extra Keywords:</strong> 0 ($25.00/month for each)</p>
                </div>
                <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-700 text-sm mt-2">
                  MANAGE MY KEYWORDS
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Textable Numbers Section */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Phone className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Textable Numbers</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Included Textable Numbers:</strong> 0 (0 used)</p>
                  <p><strong>Extra Textable Numbers:</strong> 0 ($25.00/month for each)</p>
                </div>
                <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-700 text-sm mt-2">
                  MANAGE MY TEXTABLE NUMBERS
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button variant="link" className="text-blue-600 hover:text-blue-700">
          CANCEL MY ACCOUNT
        </Button>
        <Button variant="link" className="text-blue-600 hover:text-blue-700">
          PAUSE MY ACCOUNT
        </Button>
      </div>
    </div>
  );
};

export default SettingsPlanDetails;
