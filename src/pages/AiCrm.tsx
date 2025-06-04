import { useState } from 'react';
import TopToolbar from '@/components/TopToolbar';
import Sidebar from '@/components/dashboard/Sidebar';
import TopBar from '@/components/dashboard/TopBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CustomerInbox from '@/components/ai-crm/CustomerInbox';
import SmartSegments from '@/components/ai-crm/SmartSegments';
import CustomerProfilePanel from '@/components/ai-crm/CustomerProfilePanel';
import AiFollowUps from '@/components/ai-crm/AiFollowUps';
import ChurnAlerts from '@/components/ai-crm/ChurnAlerts';
import CustomerTimeline from '@/components/ai-crm/CustomerTimeline';
import AskAi from '@/components/ai-crm/AskAi';

const AiCrm = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      
      <div 
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "ml-[70px]" : "ml-[240px]"
        }`}
      >
        <TopToolbar />
        
        <main className="p-4 sm:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">AI CRM</h1>
            <p className="text-gray-500">Smart customer engagement powered by AI</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <CustomerInbox onSelectCustomer={handleSelectCustomer} />
            <SmartSegments />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <AiFollowUps />
            <ChurnAlerts />
          </div>
          
          <div className="grid grid-cols-1 gap-6 mb-6">
            <CustomerTimeline customerId={selectedCustomerId} />
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <AskAi />
          </div>
        </main>
      </div>
      
      {selectedCustomerId && (
        <CustomerProfilePanel 
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
        />
      )}
    </div>
  );
};

export default AiCrm;
