
import React, { useState } from 'react';
import { CsvColumn } from './ImportContactsDialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronRight, Info } from 'lucide-react';

interface MapStageProps {
  columns: CsvColumn[];
  onColumnsChange: (columns: CsvColumn[]) => void;
  dontImportUnmapped: boolean;
  onDontImportUnmappedChange: (value: boolean) => void;
}

const MapStage: React.FC<MapStageProps> = ({
  columns,
  onColumnsChange,
  dontImportUnmapped,
  onDontImportUnmappedChange
}) => {
  const [expandedSection, setExpandedSection] = useState<string>('create');

  const fieldOptions = [
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'company', label: 'Company' },
    { value: 'status', label: 'Status' },
    { value: 'tags', label: 'Tags' }
  ];

  const handleFieldMapping = (columnHeader: string, fieldValue: string | null) => {
    const updatedColumns = columns.map(col => {
      if (col.header === columnHeader) {
        return { ...col, mappedTo: fieldValue };
      }
      return col;
    });
    onColumnsChange(updatedColumns);
  };

  const handleColumnSelectionChange = (columnHeader: string, selected: boolean) => {
    const updatedColumns = columns.map(col => {
      if (col.header === columnHeader) {
        return { ...col, selected };
      }
      return col;
    });
    onColumnsChange(updatedColumns);
  };

  const handleUpdateEmptyValuesChange = (columnHeader: string, updateEmptyValues: boolean) => {
    const updatedColumns = columns.map(col => {
      if (col.header === columnHeader) {
        return { ...col, updateEmptyValues };
      }
      return col;
    });
    onColumnsChange(updatedColumns);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  const getUnmappedColumnsCount = () => {
    return columns.filter(col => !col.mappedTo || !col.selected).length;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-medium mb-4">Mapping guide</h2>
        <p className="text-gray-600">
          Ensure all required fields are correctly mapped for a smooth import process. Validate and finalize your data before completing the import.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6">
          <h3 className="text-base font-medium mb-4">Fields required to</h3>

          <div className="border rounded-md overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
              onClick={() => toggleSection('create')}
            >
              <div className="flex items-center">
                {expandedSection === 'create' ? (
                  <ChevronDown className="h-5 w-5 text-gray-500 mr-2" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500 mr-2" />
                )}
                <span className="font-medium">Create contacts</span>
              </div>
            </div>
            
            {expandedSection === 'create' && (
              <div className="p-4 border-t">
                <p className="text-sm text-gray-600 mb-2">
                  At minimum, the "Name" field is required to create a new contact.
                </p>
              </div>
            )}
          </div>

          <div className="border rounded-md overflow-hidden mt-3">
            <div 
              className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
              onClick={() => toggleSection('update')}
            >
              <div className="flex items-center">
                {expandedSection === 'update' ? (
                  <ChevronDown className="h-5 w-5 text-gray-500 mr-2" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500 mr-2" />
                )}
                <span className="font-medium">Update contacts</span>
              </div>
            </div>
            
            {expandedSection === 'update' && (
              <div className="p-4 border-t">
                <p className="text-sm text-gray-600 mb-2">
                  To update existing contacts, you need to identify them by email or phone number.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <h3 className="text-base font-medium mb-4">Uploaded files</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-1/4">
                    Column header in file
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-1/4">
                    Preview information
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-1/6">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-1/6">
                    <div className="flex items-center">
                      Object
                      <Info className="h-4 w-4 ml-1 text-gray-400" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-1/6">
                    <div className="flex items-center">
                      Fields
                      <Info className="h-4 w-4 ml-1 text-gray-400" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-1/6">
                    Update empty values
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {columns.map((column, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      <div className="flex items-center">
                        <Checkbox 
                          id={`select-${column.header}`}
                          checked={column.selected}
                          onCheckedChange={(checked) => 
                            handleColumnSelectionChange(column.header, checked === true)
                          }
                          className="mr-2"
                        />
                        <label 
                          htmlFor={`select-${column.header}`}
                          className="cursor-pointer"
                        >
                          {column.header}
                        </label>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      <div className="max-h-24 overflow-y-auto">
                        {column.sample.map((sample, i) => (
                          <div key={i} className="truncate">
                            {sample || <span className="italic text-gray-400">empty</span>}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {column.mappedTo ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <svg className="mr-1 h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="3" />
                          </svg>
                          Mapped
                        </span>
                      ) : (
                        <span className="text-gray-500">Not mapped</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      Contact
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <Select 
                        value={column.mappedTo || ''} 
                        onValueChange={(value) => handleFieldMapping(column.header, value || null)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Do not import</SelectItem>
                          {fieldOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <Checkbox 
                        id={`empty-${column.header}`}
                        checked={column.updateEmptyValues}
                        onCheckedChange={(checked) => 
                          handleUpdateEmptyValuesChange(column.header, checked === true)
                        }
                        disabled={!column.mappedTo || !column.selected}
                      />
                      <label 
                        htmlFor={`empty-${column.header}`}
                        className={`ml-2 text-sm ${!column.mappedTo || !column.selected ? 'text-gray-400' : 'text-gray-700'}`}
                      >
                        Don't update to an empty value
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 flex items-center">
            <Checkbox 
              id="dont-import-unmapped"
              checked={dontImportUnmapped}
              onCheckedChange={(checked) => onDontImportUnmappedChange(checked === true)}
            />
            <label htmlFor="dont-import-unmapped" className="ml-2 text-sm text-gray-700">
              Don't import data in {getUnmappedColumnsCount()} unmapped {getUnmappedColumnsCount() === 1 ? 'column' : 'columns'}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapStage;
