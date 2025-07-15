
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, Users, Zap, ChefHat, Utensils } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const RestaurantMarketingAgent: React.FC = () => {
  const [campaignType, setCampaignType] = useState<'sms' | 'email'>('sms');
  const [restaurantName, setRestaurantName] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [specialOffer, setSpecialOffer] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState('friendly');
  const [customMessage, setCustomMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateCampaign = async () => {
    if (!restaurantName || !cuisine) {
      toast({
        title: "Missing Information",
        description: "Please fill in restaurant name and cuisine type.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Generate campaign content using AI
      const campaignData = {
        restaurant_name: restaurantName,
        cuisine,
        special_offer: specialOffer,
        target_audience: targetAudience,
        tone,
        campaign_type: campaignType,
        custom_message: customMessage,
      };

      // Save to telnyx_campaigns table with proper structure
      const { data, error } = await supabase
        .from('telnyx_campaigns')
        .insert([
          {
            campaign_name: `${restaurantName} - ${cuisine} Campaign`,
            message: customMessage || `Special offer at ${restaurantName}! ${specialOffer}`,
            recipients: [], // Empty array for now
            schedule_type: 'immediate',
            status: 'draft',
            media_url: null,
            segment_name: targetAudience || null,
          }
        ]);

      if (error) {
        console.error('Error saving campaign:', error);
        toast({
          title: "Error",
          description: "Failed to save campaign. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Campaign Created",
        description: `Successfully created ${campaignType.toUpperCase()} campaign for ${restaurantName}!`,
      });

      // Reset form
      setRestaurantName('');
      setCuisine('');
      setSpecialOffer('');
      setTargetAudience('');
      setCustomMessage('');

    } catch (error) {
      console.error('Error generating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to generate campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <ChefHat className="h-8 w-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">Restaurant Marketing Agent</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Create targeted SMS and email campaigns for your restaurant. Our AI helps you craft compelling messages
          that drive foot traffic and increase orders.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Configuration */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-orange-600" />
              Campaign Configuration
            </CardTitle>
            <CardDescription>
              Set up your restaurant marketing campaign details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="campaign-type">Campaign Type</Label>
                <Select value={campaignType} onValueChange={(value: 'sms' | 'email') => setCampaignType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS Campaign</SelectItem>
                    <SelectItem value="email">Email Campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="restaurant-name">Restaurant Name</Label>
              <Input
                id="restaurant-name"
                placeholder="e.g., Mario's Italian Bistro"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cuisine">Cuisine Type</Label>
              <Input
                id="cuisine"
                placeholder="e.g., Italian, Mexican, Asian Fusion"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="special-offer">Special Offer (Optional)</Label>
              <Input
                id="special-offer"
                placeholder="e.g., 20% off dinner, Buy 1 Get 1 Free"
                value={specialOffer}
                onChange={(e) => setSpecialOffer(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-audience">Target Audience (Optional)</Label>
              <Input
                id="target-audience"
                placeholder="e.g., families, date night couples, lunch crowd"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Message Customization */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-600" />
              Message Customization
            </CardTitle>
            <CardDescription>
              Customize your campaign message or let AI generate one
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-message">Custom Message (Optional)</Label>
              <Textarea
                id="custom-message"
                placeholder="Write your own message or leave blank for AI generation..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={6}
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Campaign Features:</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <Calendar className="h-3 w-3 mr-1" />
                  Smart Timing
                </Badge>
                <Badge variant="secondary">
                  <Users className="h-3 w-3 mr-1" />
                  Audience Targeting
                </Badge>
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  Delivery Tracking
                </Badge>
              </div>
            </div>

            <Separator />

            <Button 
              onClick={handleGenerateCampaign}
              disabled={isGenerating}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {isGenerating ? 'Creating Campaign...' : 'Create Campaign'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Tips */}
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-800">Marketing Tips for Restaurants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-orange-700">
            <div>
              <h4 className="font-medium mb-2">Best Times to Send:</h4>
              <ul className="space-y-1">
                <li>• Lunch campaigns: 10:30 AM - 11:30 AM</li>
                <li>• Dinner campaigns: 3:00 PM - 5:00 PM</li>
                <li>• Weekend specials: Thursday evenings</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Effective Offers:</h4>
              <ul className="space-y-1">
                <li>• Limited-time discounts (24-48 hours)</li>
                <li>• Buy-one-get-one deals</li>
                <li>• Free appetizer with entree</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RestaurantMarketingAgent;
