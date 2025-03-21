
import React, { useState } from 'react';
import { CsvColumn } from './ImportContactsDialog';

interface VerifyStageProps {
  columns: CsvColumn[];
  data: Record<string, string>[];
}

const VerifyStage: React.FC<VerifyStageProps> = ({ columns, data }) => {
  const [previewCount, setPreviewCount] = useState(5);
  
  // Get column names for mapped fields
  const mappedFieldNames = columns
    .filter(col => col.selected && col.mappedTo)
    .map(col => ({
      header: col.header,
      fieldName: col.mappedTo as string
    }));
  
  const getFieldNameForHeader = (header: string) => {
    const mapping = mappedFieldNames.find(m => m.header === header);
    return mapping ? mapping.fieldName : header;
  };
  
  // Count total rows
  const totalRows = data.length;
  
  // Get sample data
  const previewData = data.slice(0, previewCount);
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-medium mb-2">Verify import data</h2>
        <p className="text-gray-600 mb-4">
          Review the data before importing. The preview shows {previewCount} of {totalRows} rows.
        </p>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">#</th>
                {columns.map((col, i) => (
                  <th key={i} className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    {getFieldNameForHeader(col.header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {previewData.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-4 py-3 text-sm text-gray-500">{rowIndex + 1}</td>
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-4 py-3 text-sm text-gray-700">
                      {row[col.header] || <span className="italic text-gray-400">empty</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>
            Showing {Math.min(previewCount, totalRows)} of {totalRows} rows.
            {totalRows > previewCount && (
              <button 
                className="ml-2 text-indigo-600 hover:text-indigo-800"
                onClick={() => setPreviewCount(prev => Math.min(prev + 5, totalRows))}
              >
                Show more
              </button>
            )}
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-medium mb-2">Import summary</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Total rows to import: {totalRows}</li>
          <li>Mapped fields: {mappedFieldNames.length}</li>
          <li>
            Fields being imported: {mappedFieldNames.map(m => m.fieldName).join(', ')}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default VerifyStage;
