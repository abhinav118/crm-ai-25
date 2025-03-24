
import React, { useState } from 'react';
import { CsvColumn } from './types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VerifyStageProps {
  columns: CsvColumn[];
  data: Record<string, string>[];
}

const VerifyStage: React.FC<VerifyStageProps> = ({ columns, data }) => {
  const [showAll, setShowAll] = useState(false);
  
  // Show a maximum of 5 records initially
  const displayData = showAll ? data : data.slice(0, 5);
  
  // Filter out columns that aren't selected or mapped
  const selectedColumns = columns.filter(col => col.selected && col.mappedTo);
  
  const getValueValidationStatus = (value: string) => {
    return value && value.trim() !== '' ? 'valid' : 'invalid';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Verify Import Data</h3>
        <div className="text-sm text-muted-foreground">
          Showing {displayData.length} of {data.length} records
        </div>
      </div>
      
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {selectedColumns.map((column, index) => (
                <TableHead key={index} className="whitespace-nowrap">
                  {column.mappedTo} 
                  <span className="text-muted-foreground ml-1">
                    ({column.header})
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.length > 0 ? (
              displayData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {selectedColumns.map((column, colIndex) => {
                    const value = row[column.header];
                    const status = getValueValidationStatus(value);
                    
                    return (
                      <TableCell key={colIndex} className="whitespace-nowrap">
                        <div className="flex items-center">
                          {status === 'valid' ? (
                            <CheckCircle size={14} className="mr-2 text-green-600 flex-shrink-0" />
                          ) : (
                            <XCircle size={14} className="mr-2 text-red-600 flex-shrink-0" />
                          )}
                          <span className={status === 'invalid' ? 'text-muted-foreground italic' : ''}>
                            {value || '(empty)'}
                          </span>
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={selectedColumns.length} className="text-center py-4">
                  No data to display
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {data.length > 5 && !showAll && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setShowAll(true)}>
            Show All {data.length} Records
          </Button>
        </div>
      )}
      
      <div className="bg-muted/40 p-4 rounded-md">
        <h4 className="font-medium mb-2">Import Summary</h4>
        <ul className="space-y-1 text-sm">
          <li>Total records: {data.length}</li>
          <li>Fields to import: {selectedColumns.length}</li>
          <li>
            Fields mapping: {selectedColumns.map(col => `${col.header} → ${col.mappedTo}`).join(', ')}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default VerifyStage;
