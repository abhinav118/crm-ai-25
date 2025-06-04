
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Settings, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Sample scheduled campaigns data
const scheduledCampaigns = [
  {
    id: '1',
    title: 'June Flash Deal',
    message: '🔥 Don\'t miss our Flash Deal! Get 50% off everything until midnight. Use code FLASH50 🛍️',
    scheduledFor: '2025-06-14T08:00',
    recipientGroup: 'VIP Customers',
    recipients: 320
  },
  {
    id: '2',
    title: 'Summer Sale Blast',
    message: 'Hey {{first_name}}! ☀️ Summer sale is here - Up to 70% off on summer collection. Limited time offer!',
    scheduledFor: '2025-06-18T10:30',
    recipientGroup: 'All Contacts',
    recipients: 450
  },
  {
    id: '3',
    title: 'Father\'s Day Special',
    message: 'Celebrate Dad with our special Father\'s Day menu! 👨‍👩‍👧‍👦 Book your table now for June 15th.',
    scheduledFor: '2025-06-15T09:00',
    recipientGroup: 'Family Diners',
    recipients: 180
  }
];

// U.S. Holidays data
const holidays = [
  { date: '2025-01-01', name: 'New Year\'s Day' },
  { date: '2025-01-20', name: 'Martin Luther King Jr. Day' },
  { date: '2025-02-17', name: 'Presidents\' Day' },
  { date: '2025-05-11', name: 'Mother\'s Day' },
  { date: '2025-05-26', name: 'Memorial Day' },
  { date: '2025-06-15', name: 'Father\'s Day' },
  { date: '2025-07-04', name: 'Independence Day' },
  { date: '2025-09-01', name: 'Labor Day' },
  { date: '2025-10-13', name: 'Columbus Day' },
  { date: '2025-11-11', name: 'Veterans Day' },
  { date: '2025-11-27', name: 'Thanksgiving' },
  { date: '2025-12-25', name: 'Christmas' }
];

const CampaignCalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 5)); // June 2025
  const navigate = useNavigate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (date: Date) => {
    // Navigate to create campaign with pre-filled schedule date
    const formatted = date.toISOString();
    navigate(`/campaigns/create?scheduleFor=${formatted}`);
  };

  const handleViewCampaign = (campaignId: string) => {
    navigate(`/campaigns/create?fromCampaignId=${campaignId}`);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDateIterator = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDateIterator));
      currentDateIterator.setDate(currentDateIterator.getDate() + 1);
    }
    
    return days;
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getCampaignsForDate = (date: Date) => {
    return scheduledCampaigns.filter(campaign => {
      const campaignDate = new Date(campaign.scheduledFor);
      return (
        campaignDate.getDate() === date.getDate() &&
        campaignDate.getMonth() === date.getMonth() &&
        campaignDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getHolidaysForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    return holidays.filter(holiday => holiday.date === dateString);
  };

  const days = getDaysInMonth();

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Calendar Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {/* Day Headers */}
          {dayNames.map(day => (
            <div key={day} className="bg-gray-50 p-3 text-center text-xs font-medium text-gray-600">
              {day}
            </div>
          ))}
          
          {/* Calendar Days */}
          {days.map((day, index) => {
            const campaigns = getCampaignsForDate(day);
            const dayHolidays = getHolidaysForDate(day);
            const isCurrentMonthDay = isCurrentMonth(day);
            const isTodayDay = isToday(day);
            
            return (
              <div 
                key={index} 
                className={`bg-white p-2 min-h-[120px] border-r border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  !isCurrentMonthDay ? 'text-gray-300' : 'text-gray-900'
                }`}
                onClick={() => handleDayClick(day)}
              >
                <div className={`text-sm font-medium mb-2 ${
                  isTodayDay ? 'bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center' : ''
                }`}>
                  {day.getDate()}
                </div>
                
                {/* U.S. Holidays */}
                {dayHolidays.map((holiday) => (
                  <div 
                    key={holiday.name}
                    className="bg-red-500 text-white text-xs rounded-md px-2 py-0.5 mb-1 w-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {holiday.name}
                  </div>
                ))}
                
                {/* Scheduled Campaigns */}
                <div className="space-y-1">
                  {campaigns.map((campaign) => (
                    <div 
                      key={campaign.id}
                      className="bg-blue-100 text-blue-800 rounded-md px-2 py-1 text-sm shadow-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="font-medium truncate mb-1">
                        {campaign.title}
                      </div>
                      <div className="text-xs mb-1">
                        {new Date(campaign.scheduledFor).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="text-xs text-blue-500 flex items-center gap-1 mt-1">
                        <Eye className="h-3 w-3" />
                        <button
                          className="hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewCampaign(campaign.id);
                          }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CampaignCalendarView;
