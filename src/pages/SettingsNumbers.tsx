
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Toggle } from '@/components/ui/toggle';
import { useTelnyxMessagingProfiles, TelnyxNumberData } from '@/hooks/useTelnyxMessagingProfiles';
import { useProfile } from '@/hooks/useProfile';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const SettingsNumbers: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterValue, setFilterValue] = useState('all');

  const { data: telnyxData, isLoading, error, refetch } = useTelnyxMessagingProfiles();
  const { profileData, updateProfile, updating } = useProfile();
  const { toast } = useToast();

  console.log('SettingsNumbers - telnyxData:', telnyxData);
  console.log('SettingsNumbers - isLoading:', isLoading);
  console.log('SettingsNumbers - error:', error);
  console.log('SettingsNumbers - profileData:', profileData);

  // Filter numbers based on search criteria
  const filteredNumbers = useMemo(() => {
    if (!telnyxData?.data) return [];
    
    return telnyxData.data.filter(number => {
      if (filterValue === 'all') return true;
      // Add more filter logic here if needed
      return number.phone_number.includes(filterValue) || 
             number.messaging_profile_name.toLowerCase().includes(filterValue.toLowerCase());
    });
  }, [telnyxData?.data, filterValue]);

  // Pagination logic
  const totalPages = Math.ceil(filteredNumbers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNumbers = filteredNumbers.slice(startIndex, startIndex + itemsPerPage);

  // Ensure filterValue is never empty or undefined
  const safeFilterValue = filterValue && filterValue.trim() !== '' ? filterValue : 'all';
  // Ensure itemsPerPage is a valid number string
  const safeItemsPerPage = itemsPerPage && itemsPerPage > 0 ? itemsPerPage.toString() : '10';

  // Format phone number for display
  const formatPhoneNumber = (phoneNumber: string) => {
    // Remove + and country code if present
    const cleaned = phoneNumber.replace(/^\+?1?/, '');
    
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    return phoneNumber; // Return original if not standard format
  };

  // Handle toggle change
  const handleToggleChange = async (phoneNumber: string, isPressed: boolean) => {
    if (!profileData) {
      toast({
        title: 'Error',
        description: 'Profile data not loaded',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isPressed) {
        // Set this number as the textable number
        await updateProfile({ textableNumber: phoneNumber });
        toast({
          title: 'Success',
          description: `${formatPhoneNumber(phoneNumber)} is now your textable number`,
        });
      } else {
        // Clear the textable number
        await updateProfile({ textableNumber: '' });
        toast({
          title: 'Success',
          description: 'Textable number cleared',
        });
      }
    } catch (error) {
      console.error('Error updating textable number:', error);
      toast({
        title: 'Error',
        description: 'Failed to update textable number',
        variant: 'destructive',
      });
    }
  };

  // Check if a number is currently the textable number
  const isTextableNumber = (phoneNumber: string) => {
    return profileData?.textableNumber === phoneNumber;
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  );

  const ErrorDisplay = () => (
    <Card className="bg-white border border-red-200">
      <CardContent className="p-6 text-center">
        <p className="text-red-600 mb-4">Failed to load messaging profiles and phone numbers.</p>
        <p className="text-sm text-gray-500 mb-4">
          {error?.message || 'Please check your Telnyx API configuration.'}
        </p>
        <Button onClick={() => refetch()} variant="outline">
          Try Again
        </Button>
      </CardContent>
    </Card>
  );

  const EmptyState = () => (
    <Card className="bg-white border border-gray-200">
      <CardContent className="p-6 text-center">
        <p className="text-gray-600 mb-2">No textable numbers found.</p>
        <p className="text-sm text-gray-500">
          Configure messaging profiles and phone numbers in your Telnyx account.
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Textable Numbers</h1>
        <p className="text-gray-600 max-w-4xl">
          These are your dedicated numbers to send and receive text messages. Numbers are organized by messaging profiles from your Telnyx account. Toggle one number to set it as your primary textable number.
        </p>
      </div>

      {/* Filters Section */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Select value={safeFilterValue} onValueChange={setFilterValue}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter numbers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Numbers</SelectItem>
                <SelectItem value="773">Numbers with 773</SelectItem>
                <SelectItem value="737">Numbers with 737</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={safeItemsPerPage} onValueChange={(value) => setItemsPerPage(Number(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto text-sm text-gray-500">
              {filteredNumbers.length} total numbers
              {profileData?.textableNumber && (
                <span className="ml-2 text-blue-600">
                  • Active: {formatPhoneNumber(profileData.textableNumber)}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <LoadingSkeleton />
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !isLoading && <ErrorDisplay />}

      {/* Empty State */}
      {!isLoading && !error && filteredNumbers.length === 0 && <EmptyState />}

      {/* Numbers Table */}
      {!isLoading && !error && filteredNumbers.length > 0 && (
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium text-gray-700">Phone Number</TableHead>
                  <TableHead className="font-medium text-gray-700">Messaging Profile</TableHead>
                  <TableHead className="font-medium text-gray-700">Type</TableHead>
                  <TableHead className="font-medium text-gray-700">Primary Number</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedNumbers.map((number) => (
                  <TableRow key={number.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">
                          {formatPhoneNumber(number.phone_number)}
                        </span>
                        {isTextableNumber(number.phone_number) && (
                          <Badge variant="default" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {number.messaging_profile_name}
                    </TableCell>
                    <TableCell className="text-gray-600">{number.type}</TableCell>
                    <TableCell>
                      <Toggle
                        pressed={isTextableNumber(number.phone_number)}
                        onPressedChange={(pressed) => handleToggleChange(number.phone_number, pressed)}
                        disabled={updating}
                        aria-label={`Set ${formatPhoneNumber(number.phone_number)} as primary textable number`}
                        className="data-[state=on]:bg-blue-600 data-[state=on]:text-white"
                      >
                        {isTextableNumber(number.phone_number) ? 'Active' : 'Set Primary'}
                      </Toggle>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {!isLoading && !error && totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    isActive={currentPage === page}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(page);
                    }}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 pt-8 border-t">
        <div className="space-x-4">
          <a href="#" className="hover:text-gray-700">Terms of Service</a>
          <span>•</span>
          <a href="#" className="hover:text-gray-700">Privacy Policy</a>
          <span>•</span>
          <span>© 2025 TextFlow. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
};

export default SettingsNumbers;
