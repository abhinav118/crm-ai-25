import React, { useState, useEffect } from 'react';
import { CsvColumn } from './types';
import { CheckCircle, HelpCircle, XCircle } from 'lucide-react';
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

interface MapStageProps {
  columns: CsvColumn[];
  setColumns: React.Dispatch<React.SetStateAction<CsvColumn[]>>;
}

const MapStage: React.FC<MapStageProps> = ({ columns, setColumns }) => {
  // List of available fields in the contacts table
  const contactFields = [
    { id: 'name', label: 'Name', required: true },
    { id: 'email', label: 'Email', required: false },
    { id: 'phone', label: 'Phone', required: false },
    { id: 'company', label: 'Company', required: false },
    { id: 'status', label: 'Status', required: false },
    { id: 'tags', label: 'Tags', required: false },
  ];

  const [autoMapApplied, setAutoMapApplied] = useState(false);

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
    updatedColumns[index].mappedTo = mappedTo !== "" ? mappedTo : null;
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
      // Common field synonyms
      const nameFields = ['name', 'full name', 'fullname', 'person', 'contact'];
      const emailFields = ['email', 'e-mail', 'mail', 'email address'];
      const phoneFields = ['phone', 'telephone', 'mobile', 'cell', 'contact number', 'tel', 'phone number'];
      const companyFields = ['company', 'organization', 'business', 'employer', 'org', 'firm'];
      const statusFields = ['status', 'state', 'active', 'inactive'];
      const tagFields = ['tag', 'category', 'group', 'label'];
      
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
      
      // 3. Special case for first name and last name
      if (headerLower.includes('first') && headerLower.includes('name')) {
        return {
          ...column,
          selected: true,
          mappedTo: 'name' // Map to name
        };
      }
      
      if (headerLower.includes('last') && headerLower.includes('name')) {
        // For last name, we'll keep it selected but not mapped yet
        return {
          ...column,
          selected: true,
          mappedTo: null
        };
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
    
    // Check for first name and last name columns to possibly combine
    const firstNameCol = updatedColumns.find(col => 
      col.header.toLowerCase().includes('first') && col.header.toLowerCase().includes('name')
    );
    
    const lastNameCol = updatedColumns.find(col => 
      col.header.toLowerCase().includes('last') && col.header.toLowerCase().includes('name')
    );
    
    if (firstNameCol && lastNameCol) {
      toast({
        title: "Name fields detected",
        description: "First name and last name fields were detected. They will be combined into the Name field during import.",
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Map Columns to Contact Fields</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select which CSV columns to import and map them to contact fields.
        </p>
      </div>
      
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-6">
          {columns.map((column, index) => (
            <div key={index} className="border rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id={`column-${index}`}
                    checked={column.selected}
                    onCheckedChange={(checked) => handleSelectColumn(index, checked === true)}
                  />
                  <Label 
                    htmlFor={`column-${index}`}
                    className="font-medium"
                  >
                    {column.header}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor={`update-empty-${index}`} className="text-xs text-muted-foreground">
                    Update empty values
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle size={14} className="text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-[200px]">
                          If enabled, this will update empty values in your contacts with default values.
                          For example, empty names will be set to "Imported Contact".
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Switch 
                    id={`update-empty-${index}`}
                    checked={column.updateEmptyValues || false}
                    onCheckedChange={(checked) => handleUpdateEmptyValues(index, checked)}
                    disabled={!column.selected}
                  />
                </div>
              </div>
              
              <div className="pl-6 space-y-2">
                {column.sample && (
                  <div>
                    <span className="text-xs text-muted-foreground">Sample: </span>
                    <span className="text-xs">{column.sample}</span>
                  </div>
                )}
                
                <div className="max-w-md">
                  <Select
                    value={column.mappedTo || undefined}
                    onValueChange={(value) => handleMapColumn(index, value)}
                    disabled={!column.selected}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Map to field..." />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Add a dummy non-empty value to avoid the Radix UI error */}
                      <SelectItem value="_none_">-- Don't Map --</SelectItem>
                      {contactFields.map(field => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.label} {field.required && '*'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MapStage;
