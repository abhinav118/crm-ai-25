
import React, { useState, useRef } from 'react';
import { ImportMode } from './ImportContactsDialog';
import { CsvColumn } from './ImportContactsDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';

interface UploadStageProps {
  onFileUpload: (file: File, data: Record<string, string>[], columns: CsvColumn[]) => void;
  importMode: ImportMode;
  onImportModeChange: (mode: ImportMode) => void;
}

const UploadStage: React.FC<UploadStageProps> = ({ 
  onFileUpload, 
  importMode,
  onImportModeChange
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file) return;
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a CSV file',
        variant: 'destructive',
      });
      return;
    }
    
    if (file.size > 30 * 1024 * 1024) { // 30MB limit
      toast({
        title: 'File too large',
        description: 'File size exceeds 30MB limit',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data as Record<string, string>[];
        
        if (parsedData.length === 0 || Object.keys(parsedData[0]).length === 0) {
          toast({
            title: 'Empty file',
            description: 'The uploaded CSV file is empty or has no valid data',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        // Extract columns
        const headers = Object.keys(parsedData[0]);
        
        // Get sample data for each column (up to 3 rows)
        const columns: CsvColumn[] = headers.map(header => {
          const samples = parsedData.slice(0, 3).map(row => row[header] || '');
          return {
            header,
            sample: samples,
            mappedTo: null,
            selected: true,
            updateEmptyValues: false
          };
        });
        
        onFileUpload(file, parsedData, columns);
        setIsLoading(false);
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        toast({
          title: 'Failed to parse CSV',
          description: error.message,
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const generateSampleFile = () => {
    const headers = ['name', 'email', 'phone', 'company', 'status', 'tags'];
    const sampleData = [
      ['John Doe', 'john@example.com', '123-456-7890', 'Acme Inc', 'active', 'client,important'],
      ['Jane Smith', 'jane@example.com', '987-654-3210', 'XYZ Corp', 'inactive', 'prospect'],
      ['Alex Johnson', 'alex@example.com', '555-555-5555', 'ABC Ltd', 'active', 'lead,new']
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'contacts_sample.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-4">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-medium mb-2">Upload your files</h2>
        <p className="text-gray-600 mb-4">
          Before uploading files, make sure your file is ready to import.{' '}
          <button 
            className="text-indigo-600 hover:text-indigo-800 font-medium" 
            onClick={generateSampleFile}
          >
            Download sample file
          </button>{' '}
          or{' '}
          <button className="text-indigo-600 hover:text-indigo-800 font-medium">
            learn more
          </button>.
        </p>
        
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors ${
            dragActive 
              ? 'border-indigo-500 bg-indigo-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".csv"
            onChange={handleFileChange}
          />
          <p className="text-gray-700 mb-1 cursor-pointer">
            Click to upload or drag and drop
          </p>
          <p className="text-gray-500 text-sm">
            csv (max size 30MB)
          </p>
        </div>
        
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Choose how to import contacts</h3>
          <Select 
            value={importMode} 
            onValueChange={(value) => onImportModeChange(value as ImportMode)}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Create and update contacts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="create">Create new contacts only</SelectItem>
              <SelectItem value="update">Update existing contacts only</SelectItem>
              <SelectItem value="both">Create and update contacts</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default UploadStage;
