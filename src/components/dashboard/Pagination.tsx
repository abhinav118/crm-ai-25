
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalRecords?: number;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  className?: string;
};

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalRecords,
  pageSize = 20,
  onPageSizeChange,
  className,
}) => {
  const pageSizes = [10, 20, 50, 100];
  
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };
  
  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };
  
  const renderPageNumbers = () => {
    // Always show first and last page, and up to 3 pages around current page
    const pages = [];
    const rangeStart = Math.max(1, currentPage - 1);
    const rangeEnd = Math.min(totalPages, currentPage + 1);
    
    if (rangeStart > 1) {
      pages.push(1);
      if (rangeStart > 2) pages.push('...');
    }
    
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }
    
    if (rangeEnd < totalPages) {
      if (rangeEnd < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    
    return pages.map((page, index) => {
      if (page === '...') {
        return (
          <span 
            key={`ellipsis-${index}`} 
            className="pagination-button text-gray-500"
          >
            ...
          </span>
        );
      }
      
      return (
        <button
          key={page}
          onClick={() => onPageChange(page as number)}
          className={cn(
            "pagination-button",
            page === currentPage 
              ? "active" 
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          {page}
        </button>
      );
    });
  };
  
  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4", className)}>
      {totalRecords !== undefined && (
        <div className="text-sm text-gray-600">
          Total {totalRecords.toLocaleString()} records
        </div>
      )}
      
      <div className="flex items-center gap-1">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className={cn(
            "pagination-button",
            currentPage === 1 
              ? "text-gray-400 cursor-not-allowed" 
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <ChevronLeft size={16} />
        </button>
        
        <div className="flex items-center gap-1">
          {renderPageNumbers()}
        </div>
        
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={cn(
            "pagination-button",
            currentPage === totalPages
              ? "text-gray-400 cursor-not-allowed" 
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <ChevronRight size={16} />
        </button>
      </div>
      
      {onPageSizeChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="text-sm border border-gray-300 rounded p-1 bg-white"
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default Pagination;
