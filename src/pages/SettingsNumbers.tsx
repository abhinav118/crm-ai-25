
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

// Sample data for textable numbers
const sampleNumbers = [
  {
    id: '1',
    number: '(773) 389-7839',
    type: 'Textable Number',
    voiceSettings: 'Inbound Call Reply',
    isDefault: true
  },
  {
    id: '2',
    number: '(737) 237-6448',
    type: 'Textable Number',
    voiceSettings: 'Inbound Call Reply',
    isDefault: false
  },
  {
    id: '3',
    number: '(512) 555-0123',
    type: 'Textable Number',
    voiceSettings: 'Inbound Call Reply',
    isDefault: false
  }
];

const DEFAULT_NUMBER = "(773) 389-7839";

const SettingsNumbers: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterValue, setFilterValue] = useState('all');
  const [showOnlyDefault, setShowOnlyDefault] = useState(true); // Default to showing only the target number

  console.log('SettingsNumbers - filterValue:', filterValue);
  console.log('SettingsNumbers - filterValue type:', typeof filterValue);
  console.log('SettingsNumbers - itemsPerPage:', itemsPerPage);
  console.log('SettingsNumbers - itemsPerPage type:', typeof itemsPerPage);

  // Filter numbers - by default show only the target number
  const baseFilteredNumbers = showOnlyDefault 
    ? sampleNumbers.filter(number => number.number === DEFAULT_NUMBER)
    : sampleNumbers;

  // Apply additional filters if any
  const filteredNumbers = baseFilteredNumbers.filter(number => {
    if (filterValue === 'all') return true;
    return number.number.includes(filterValue);
  });

  const totalPages = Math.ceil(filteredNumbers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNumbers = filteredNumbers.slice(startIndex, startIndex + itemsPerPage);

  // Ensure filterValue is never empty or undefined
  const safeFilterValue = filterValue && filterValue.trim() !== '' ? filterValue : 'all';
  // Ensure itemsPerPage is a valid number string
  const safeItemsPerPage = itemsPerPage && itemsPerPage > 0 ? itemsPerPage.toString() : '10';

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Textable Numbers</h1>
        <p className="text-gray-600 max-w-4xl">
          These are your dedicated numbers to send and receive text messages. By default, if someone attempts to call your numbers, we'll play an automated message instructing them to text your number (not available for short codes or business numbers).
        </p>
      </div>

      {/* Filters Section */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Select value={safeFilterValue} onValueChange={setFilterValue}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Number 0–9" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Numbers</SelectItem>
                <SelectItem value="zero">Number 0–9</SelectItem>
                <SelectItem value="one">Number 1–9</SelectItem>
                <SelectItem value="two">Number 2–9</SelectItem>
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

            {/* Toggle to show all numbers or just the default one */}
            <Button
              variant={showOnlyDefault ? "outline" : "default"}
              onClick={() => setShowOnlyDefault(!showOnlyDefault)}
              className="ml-auto"
            >
              {showOnlyDefault ? "Show All Numbers" : "Show Default Only"}
            </Button>
          </div>
          
          {showOnlyDefault && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>Default View:</strong> Showing only default number {DEFAULT_NUMBER}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Numbers Table */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium text-gray-700">Number</TableHead>
                <TableHead className="font-medium text-gray-700">Type</TableHead>
                <TableHead className="font-medium text-gray-700">Voice Settings</TableHead>
                <TableHead className="font-medium text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedNumbers.map((number) => (
                <TableRow key={number.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{number.number}</span>
                      {number.isDefault && (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                          Default
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">{number.type}</TableCell>
                  <TableCell className="text-gray-600">{number.voiceSettings}</TableCell>
                  <TableCell>
                    <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-700">
                      View Settings
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
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
