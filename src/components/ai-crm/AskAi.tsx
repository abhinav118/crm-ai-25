
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Brain, SparkleIcon, SendHorizontal, Loader2 } from 'lucide-react';

const AskAi = () => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  
  const handleAskAi = async () => {
    if (!question.trim()) return;
    
    setIsLoading(true);
    setResponse(null);
    
    try {
      // Simulate AI response
      setTimeout(() => {
        // In a real app, this would call an API to get an AI response
        let aiResponse = '';
        
        if (question.toLowerCase().includes('john') && question.toLowerCase().includes('order')) {
          aiResponse = "John hasn't ordered in 30 days due to a poor experience with his last order. According to his interaction history, he contacted support about a damaged item but didn't receive a follow-up. I recommend sending a personalized email acknowledging the issue, offering a special discount, and ensuring it doesn't happen again.";
        } else if (question.toLowerCase().includes('customers') && question.toLowerCase().includes('summer sale')) {
          aiResponse = "Based on previous summer sales, you should target customers who made outdoor goods purchases in the last 90 days and customers who responded to previous seasonal promotions. I've identified 587 customers matching this profile with an average response rate of 23% to similar campaigns. The optimal notification time is Tuesday or Thursday around 11 AM based on historical engagement patterns.";
        } else if (question.toLowerCase().includes('segment')) {
          aiResponse = "Your most profitable customer segment is the 'Weekend Regulars' group. They order 2.3x more frequently than average customers and have a 47% higher average order value. Most of these customers first came to you through Instagram ads or referrals. I recommend increasing your marketing investment in these channels and creating a weekend-focused loyalty program.";
        } else {
          aiResponse = "I've analyzed your question and the CRM data. What specific information are you looking for about your customers? I can help with purchase patterns, segment analysis, churn prediction, or personalized marketing recommendations.";
        }
        
        setResponse(aiResponse);
        setIsLoading(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error asking AI:', error);
      setResponse('Sorry, I encountered an error while processing your question. Please try again later.');
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAskAi();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Ask AI About Your Customers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-500 text-sm">
            Ask questions about your customers, segments, or get marketing recommendations
          </p>
          
          <div className="flex gap-2">
            <Input 
              placeholder="e.g., 'Why hasn't John ordered in 30 days?'" 
              value={question} 
              onChange={(e) => setQuestion(e.target.value)} 
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button onClick={handleAskAi} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {isLoading && (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full border-2 border-t-primary border-primary/30 animate-spin"></div>
                <span className="text-gray-500">Analyzing data and generating insights...</span>
              </div>
            </div>
          )}
          
          {response && (
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex items-start gap-2">
                <SparkleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-gray-900">{response}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="pt-2">
            <p className="text-xs text-gray-400">Example questions:</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs h-7"
                onClick={() => setQuestion("Why hasn't John ordered in 30 days?")}
              >
                Why hasn't John ordered in 30 days?
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs h-7"
                onClick={() => setQuestion("Which customers should I target for my summer sale?")}
              >
                Which customers should I target for my summer sale?
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs h-7"
                onClick={() => setQuestion("What's my most profitable customer segment?")}
              >
                What's my most profitable customer segment?
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AskAi;
