
import React, { useState, useEffect } from 'react';
import { CsvColumn } from './types';
import { CheckCircle, HelpCircle, XCircle, Info } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatPhoneNumber } from './utils/phoneUtils';

interface MapStageProps {
  columns: CsvColumn[];
  setColumns: React.Dispatch<React.SetStateAction<CsvColumn[]>>;
}

const MapStage: React.FC<MapStageProps> = ({ columns, setColumns }) => {
  // Updated contact fields to use first_name and last_name instead of name
  const contactFields = [
    { id: 'first_name', label: 'First Name', required: true },
    { id: 'last_name', label: 'Last Name', required: false },
    { id: 'email', label: 'Email', required: false },
    { id: 'phone', label: 'Phone', required: false },
    { id: 'company', label: 'Company', required: false },
    { id: 'status', label: 'Status', required: false },
    { id: 'tags', label: 'Tags', required: false },
  ];

  const [autoMapApplied, setAutoMapApplied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Auto-apply the mapping on component mount
  useEffect(() => {
    if (columns.length > 0 && !autoMapApplied) {
      autoMapColumns();
    }
  }, [columns]);

  const handleSelectColumn = (index: number, selected: boolean) => {
    const updatedColumns = [...columns];
    updatedColumns[index].selected = selected;
    
    // If deselecting, also clear the mapping
    if (!selected) {
      updatedColumns[index].mappedTo = null;
    }
    
    setColumns(updatedColumns);
  };

  const handleMapColumn = (index: number, mappedTo: string | null) => {
    const updatedColumns = [...columns];
    updatedColumns[index].mappedTo = mappedTo !== "none" ? mappedTo : null;
    setColumns(updatedColumns);
  };

  const handleUpdateEmptyValues = (index: number, updateEmptyValues: boolean) => {
    const updatedColumns = [...columns];
    updatedColumns[index].updateEmptyValues = updateEmptyValues;
    setColumns(updatedColumns);
  };

  const autoMapColumns = () => {
    if (!columns || columns.length === 0) {
      console.log("No columns to map");
      return;
    }
    
    console.log("Auto-mapping columns:", columns);
    
    const updatedColumns = [...columns].map(column => {
      // Skip columns without headers
      if (!column.header) {
        return { ...column, selected: false, mappedTo: null };
      }
      
      const headerLower = column.header.toLowerCase().trim();
      
      // 1. Direct match by lowercase field name
      const directMatch = contactFields.find(field => 
        field.id.toLowerCase() === headerLower ||
        field.label.toLowerCase() === headerLower
      );
      
      if (directMatch) {
        return {
          ...column,
          selected: true,
          mappedTo: directMatch.id
        };
      }
      
      // 2. Partial match (contains)
      // Updated field synonyms to handle first_name and last_name
      const firstNameFields = ['first name', 'firstname', 'first_name', 'fname', 'given name'];
      const lastNameFields = ['last name', 'lastname', 'last_name', 'lname', 'surname', 'family name'];
      const nameFields = ['name', 'full name', 'fullname', 'person', 'contact'];
      const emailFields = ['email', 'e-mail', 'mail', 'email address'];
      const phoneFields = ['phone', 'telephone', 'mobile', 'cell', 'contact number', 'tel', 'phone number'];
      const companyFields = ['company', 'organization', 'business', 'employer', 'org', 'firm'];
      const statusFields = ['status', 'state', 'active', 'inactive'];
      const tagFields = ['tag', 'category', 'group', 'label'];
      const segmentFields = ['segment', 'customer segment', 'contact segment', 'group name', 'segment name'];
      
      // Check for first name
      if (firstNameFields.some(term => headerLower.includes(term))) {
        return { ...column, selected: true, mappedTo: 'first_name' };
      }
      
      // Check for last name
      if (lastNameFields.some(term => headerLower.includes(term))) {
        return { ...column, selected: true, mappedTo: 'last_name' };
      }
      
      // Check for segment
      if (segmentFields.some(term => headerLower.includes(term))) {
        return { ...column, selected: true, mappedTo: 'segment' };
      }
      
      // Check for other fields
      if (nameFields.some(term => headerLower.includes(term))) {
        return { ...column, selected: true, mappedTo: 'name' };
      }
      
      if (emailFields.some(term => headerLower.includes(term))) {
        return { ...column, selected: true, mappedTo: 'email' };
      }
      
      if (phoneFields.some(term => headerLower.includes(term))) {
        return { ...column, selected: true, mappedTo: 'phone' };
      }
      
      if (companyFields.some(term => headerLower.includes(term))) {
        return { ...column, selected: true, mappedTo: 'company' };
      }
      
      if (statusFields.some(term => headerLower.includes(term))) {
        return { ...column, selected: true, mappedTo: 'status' };
      }
      
      if (tagFields.some(term => headerLower.includes(term))) {
        return { ...column, selected: true, mappedTo: 'tags' };
      }
      
      // If no match found, still show the column but don't select it
      return {
        ...column,
        selected: false,
        mappedTo: null
      };
    });
    
    console.log("Updated columns after mapping:", updatedColumns);
    setColumns(updatedColumns);
    setAutoMapApplied(true);
    
    // Check for first name and last name columns
    const firstNameCol = updatedColumns.find(col => col.mappedTo === 'first_name');
    const lastNameCol = updatedColumns.find(col => col.mappedTo === 'last_name');
    
    if (firstNameCol && lastNameCol) {
      toast({
        title: "Name fields detected",
        description: "First name and last name fields were detected and mapped successfully.",
      });
    } else if (firstNameCol && !lastNameCol) {
      toast({
        title: "First name field detected",
        description: "First name field was mapped. Consider mapping a last name field if available.",
      });
    }
    
    const mappedCount = updatedColumns.filter(col => col.selected && col.mappedTo).length;
    
    toast({
      title: "Auto-mapping applied",
      description: `${mappedCount} of ${updatedColumns.length} fields were automatically mapped.`,
    });
  };

  const getColumnStatus = (column: CsvColumn) => {
    if (!column.selected) {
      return 'skipped';
    }
    
    if (column.selected && column.mappedTo) {
      return 'mapped';
    }
    
    return 'unmapped';
  };

  const countMappedColumns = () => {
    return columns.filter(column => column.selected && column.mappedTo).length;
  };

  const countTotalColumns = () => {
    return columns.length;
  };

  // Calculate sample data for preview
  const sampleData = columns.reduce((samples, column) => {
    // Get sample values from the header if any
    const sampleValues = column.sampleValues || [];
    
    // Format phone numbers if this column is mapped to 'phone'
    if (column.mappedTo === 'phone' && column.sampleValues) {
      samples[column.header] = column.sampleValues.map(value => {
        return value ? formatPhoneNumber(value) : '';
      });
    } else {
      samples[column.header] = sampleValues;
    }
    
    return samples;
  }, {} as Record<string, string[]>);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Map Columns to Contact Fields</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select which CSV columns to import and map them to contact fields. First Name is required.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center border-b pb-2 font-medium text-sm">
          <div>Import</div>
          <div>Map CSV Column</div>
          <div className="flex items-center">
            <span>Replace Empty</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[220px] text-xs">
                    If checked, empty values will be replaced with defaults (e.g., "Unknown" for names).
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex gap-2 items-center">
            <span>Preview</span>
            <Switch 
              checked={showPreview} 
              onCheckedChange={setShowPreview}
            />
          </div>
        </div>
      
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {columns.map((column, index) => (
              <div key={index} className="grid grid-cols-[auto_1fr_auto_1fr] gap-4 items-center">
                <Checkbox 
                  id={`column-${index}`}
                  checked={column.selected}
                  onCheckedChange={() => handleSelectColumn(index, !column.selected)}
                />
                <div>
                  <Label htmlFor={`column-${index}`} className="font-medium">{column.header}</Label>
                  {showPreview && column.sampleValues && column.sampleValues.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      e.g.{' '}
                      {column.mappedTo === 'phone' 
                        ? formatPhoneNumber(column.sampleValues[0] || '')
                        : column.sampleValues[0]}
                    </div>
                  )}
                </div>
                <div>
                  {column.selected && (
                    <Switch 
                      checked={column.updateEmptyValues || false}
                      onCheckedChange={(checked) => handleUpdateEmptyValues(index, checked)}
                    />
                  )}
                </div>
                <Select
                  value={column.mappedTo || 'none'}
                  onValueChange={(value) => handleMapColumn(index, value)}
                  disabled={!column.selected}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Not mapped --</SelectItem>
                    {contactFields.map(field => (
                      <SelectItem key={field.id} value={field.id}>
                        {field.label} {field.required && '*'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      
      {showPreview && (
        <div>
          <h4 className="text-sm font-medium mb-2">Preview</h4>
          <div className="border rounded-md p-4">
            <div className="text-xs text-muted-foreground mb-2">First 3 rows with selected fields:</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {columns.filter(col => col.selected).map((column, index) => (
                      <th key={index} className="text-left p-2 text-xs font-medium">
                        {column.header}
                        <div className="text-muted-foreground">
                          {column.mappedTo ? contactFields.find(f => f.id === column.mappedTo)?.label || 'Not mapped' : 'Not mapped'}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2].map(rowIndex => (
                    <tr key={rowIndex} className="border-b">
                      {columns.filter(col => col.selected).map((column, colIndex) => {
                        const sampleValue = sampleData[column.header]?.[rowIndex] || '';
                        // Apply phone formatting for phone fields in the preview
                        const displayValue = column.mappedTo === 'phone' && sampleValue
                          ? formatPhoneNumber(sampleValue)
                          : sampleValue;
                        
                        return (
                          <td key={colIndex} className="p-2 text-xs">
                            {column.mappedTo === 'phone' ? (
                              <span className="font-medium">{displayValue || '—'}</span>
                            ) : (
                              displayValue || '—'
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapStage;
