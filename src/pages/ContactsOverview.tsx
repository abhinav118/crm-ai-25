
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

const ContactsOverview = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Contacts Overview
          </CardTitle>
          <CardDescription>
            This section will contain contact-specific interaction stats and engagement metrics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Coming Soon</p>
              <p className="text-sm">Contact interaction analytics will be available here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactsOverview;
