import React from 'react';
import { CsvColumn } from './types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info } from 'lucide-react';

interface VerifyStageProps {
  columns: CsvColumn[];
  data: Record<string, string>[];
}

const VerifyStage: React.FC<VerifyStageProps> = ({ columns, data }) => {
  const mappedColumns = columns.filter(col => col.selected && col.mappedTo);
  
  // Count unique values for matching
  const countUniqueEmails = () => {
    const emailColumn = columns.find(col => col.mappedTo === 'email');
    if (!emailColumn) return 0;
    
    const uniqueEmails = new Set(
      data
        .map(row => row[emailColumn.header])
        .filter(Boolean)
        .map(email => email.trim().toLowerCase())
    );
    
    return uniqueEmails.size;
  };
  
  const countUniquePhones = () => {
    const phoneColumn = columns.find(col => col.mappedTo === 'phone');
    if (!phoneColumn) return 0;
    
    const uniquePhones = new Set(
      data
        .map(row => row[phoneColumn.header])
        .filter(Boolean)
        .map(phone => phone.trim())
    );
    
    return uniquePhones.size;
  };

  // Count missing required values
  const countMissingValues = () => {
    // Name is the only required field
    const nameColumn = columns.find(col => col.mappedTo === 'name');
    if (!nameColumn) return data.length; // If no name column, all are missing
    
    return data.filter(row => !row[nameColumn.header]).length;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Verify Import Data</h3>
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Ready to Import</AlertTitle>
        <AlertDescription>
          Review the data below before proceeding with the import. This will import {data.length} contacts.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-muted/30 p-3 rounded-md">
          <p className="text-sm text-muted-foreground">Total Contacts</p>
          <p className="text-2xl font-semibold">{data.length}</p>
        </div>
        
        <div className="bg-muted/30 p-3 rounded-md">
          <p className="text-sm text-muted-foreground">Unique Emails</p>
          <p className="text-2xl font-semibold">{countUniqueEmails()}</p>
        </div>
        
        <div className="bg-muted/30 p-3 rounded-md">
          <p className="text-sm text-muted-foreground">Unique Phones</p>
          <p className="text-2xl font-semibold">{countUniquePhones()}</p>
        </div>
      </div>
      
      {countMissingValues() > 0 && (
        <Alert variant="warning">
          <AlertTitle>Missing Required Values</AlertTitle>
          <AlertDescription>
            {countMissingValues()} records are missing a name. These contacts may be imported with blank names.
          </AlertDescription>
        </Alert>
      )}
      
      <div>
        <h4 className="text-sm font-medium mb-2">Data Preview (first 5 rows)</h4>
        
        <ScrollArea className="h-[300px] border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                {mappedColumns.map((column, index) => (
                  <TableHead key={index}>
                    {column.header}
                    <div className="text-xs text-muted-foreground">
                      {column.mappedTo}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(0, 5).map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {mappedColumns.map((column, colIndex) => (
                    <TableCell key={colIndex}>
                      {row[column.header] || '—'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
};

export default VerifyStage;
