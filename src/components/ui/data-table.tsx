
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

export type ColumnDef<T> = {
  id: string;
  header: React.ReactNode;
  accessorKey?: keyof T;
  cell?: (info: { row: T }) => React.ReactNode;
  enableSorting?: boolean;
};

export type DataTableProps<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  onRowClick?: (row: T) => void;
  isSelectable?: boolean;
  selectedRows?: Set<string>;
  onSelectRow?: (id: string, isSelected: boolean) => void;
  onSelectAll?: (isSelected: boolean) => void;
  getRowId?: (row: T) => string;
  className?: string;
};

export function DataTable<T>({
  data,
  columns,
  onRowClick,
  isSelectable = false,
  selectedRows = new Set(),
  onSelectRow,
  onSelectAll,
  getRowId = (row: any) => row.id,
  className,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  
  const handleSort = (column: ColumnDef<T>) => {
    if (!column.enableSorting || !column.accessorKey) return;
    
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig.key === column.accessorKey) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    
    setSortConfig({ key: column.accessorKey, direction });
  };
  
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];
      
      if (aValue === bValue) return 0;
      
      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig]);
  
  const isAllSelected = 
    data.length > 0 && data.every(row => selectedRows.has(getRowId(row)));
  
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isSelected = e.target.checked;
    onSelectAll?.(isSelected);
  };
  
  const renderHeaderCell = (column: ColumnDef<T>) => {
    const isSorted = column.accessorKey && sortConfig.key === column.accessorKey;
    const sortIcon = isSorted ? (
      sortConfig.direction === 'asc' ? (
        <ChevronUp size={14} />
      ) : (
        <ChevronDown size={14} />
      )
    ) : null;
    
    return (
      <div
        className={cn(
          "flex items-center gap-1",
          column.enableSorting && "cursor-pointer"
        )}
        onClick={() => column.enableSorting && handleSort(column)}
      >
        {column.header}
        {sortIcon && <span className="text-gray-500">{sortIcon}</span>}
      </div>
    );
  };
  
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="min-w-full divide-y divide-gray-200 data-table">
        <thead className="bg-gray-50">
          <tr>
            {isSelectable && (
              <th className="w-12 py-3 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.id}
                className="table-header"
              >
                {renderHeaderCell(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((row) => {
            const rowId = getRowId(row);
            const isSelected = selectedRows.has(rowId);
            
            return (
              <tr
                key={rowId}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "hover:bg-gray-50 transition-colors",
                  onRowClick && "cursor-pointer",
                  isSelected && "bg-primary/5"
                )}
              >
                {isSelectable && (
                  <td className="py-4 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        onSelectRow?.(rowId, e.target.checked);
                      }}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.id} className="table-cell">
                    {column.cell
                      ? column.cell({ row })
                      : column.accessorKey
                      ? (row[column.accessorKey] as React.ReactNode)
                      : null}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
