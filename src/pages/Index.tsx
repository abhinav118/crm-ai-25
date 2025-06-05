
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/dashboard/Sidebar";
import TopToolbar from "@/components/TopToolbar";
import ContactsTable from "@/components/dashboard/ContactsTable";
import Conversations from "@/components/dashboard/Conversations";
import BulkActions from "@/components/dashboard/BulkActions/BulkActions";

type IndexProps = {
  initialTab?: "contacts" | "conversations" | "bulk-actions";
};

const Index = ({ initialTab = "contacts" }: IndexProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-[63px]' : 'ml-[234px]'}`}>
        <TopToolbar pageTitle="Dashboard" />
        
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="conversations">Conversations</TabsTrigger>
              <TabsTrigger value="bulk-actions">Bulk Actions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="contacts" className="space-y-4">
              <ContactsTable />
            </TabsContent>
            
            <TabsContent value="conversations" className="space-y-4">
              <Conversations />
            </TabsContent>
            
            <TabsContent value="bulk-actions" className="space-y-4">
              <BulkActions />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
