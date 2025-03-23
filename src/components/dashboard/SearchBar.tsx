
import React, { useState, useEffect } from 'react';
import { Search, Filter, X, FilterX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import FilterDialog, { FilterState } from './Filters/FilterDialog';
import { Badge } from '@/components/ui/badge';
import { format, sub } from 'date-fns';

type SearchBarProps = {
  onSearch: (query: string) => void;
  onFilterChange: (filters: FilterState) => void;
  className?: string;
  isActive?: boolean;
  onActiveChange?: (isActive: boolean) => void;
};

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  onFilterChange,
  className,
  isActive = false,
  onActiveChange = () => {}
}) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>({});
  const [filterCount, setFilterCount] = useState(0);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };
  
  const clearSearch = () => {
    setQuery('');
    onSearch('');
  };
  
  const applyFilters = (filters: FilterState) => {
    setActiveFilters(filters);
    onFilterChange(filters);
    updateFilterCount(filters);
  };

  const clearFilters = () => {
    setActiveFilters({});
    onFilterChange({});
    setFilterCount(0);
  };

  const updateFilterCount = (filters: FilterState) => {
    const count = Object.keys(filters).filter(key => filters[key as keyof FilterState] !== undefined).length;
    setFilterCount(count);
  };

  const getFilterSummary = (): string[] => {
    const summary: string[] = [];

    if (activeFilters.phone) {
      const { operator, value } = activeFilters.phone;
      if (operator === 'is' && value) {
        summary.push(`Phone: ${value}`);
      } else if (operator === 'isNot' && value) {
        summary.push(`Phone is not ${value}`);
      } else if (operator === 'isEmpty') {
        summary.push('Phone is empty');
      } else if (operator === 'isNotEmpty') {
        summary.push('Phone is not empty');
      }
    }

    if (activeFilters.email) {
      const { operator, value } = activeFilters.email;
      if (operator === 'is' && value) {
        summary.push(`Email: ${value}`);
      } else if (operator === 'isNot' && value) {
        summary.push(`Email is not ${value}`);
      } else if (operator === 'isEmpty') {
        summary.push('Email is empty');
      } else if (operator === 'isNotEmpty') {
        summary.push('Email is not empty');
      }
    }

    if (activeFilters.tag) {
      const { operator, value } = activeFilters.tag;
      if (operator === 'is' && value) {
        summary.push(`Tag: ${value}`);
      } else if (operator === 'isNot' && value) {
        summary.push(`Tag is not ${value}`);
      } else if (operator === 'isEmpty') {
        summary.push('Tag is empty');
      } else if (operator === 'isNotEmpty') {
        summary.push('Tag is not empty');
      } else if (operator === 'anyOf' && value) {
        summary.push(`Tag is any of ${value}`);
      }
    }

    if (activeFilters.created) {
      const { operator, value, unit } = activeFilters.created;
      if (operator === 'moreThan' && value !== null) {
        summary.push(`Created more than ${value} ${unit} ago`);
      } else if (operator === 'lessThan' && value !== null) {
        summary.push(`Created less than ${value} ${unit} ago`);
      } else if (operator === 'range') {
        summary.push('Created in date range');
      }
    }

    return summary;
  };
  
  useEffect(() => {
    onActiveChange(isFocused);
  }, [isFocused, onActiveChange]);
  
  return (
    <div className={cn(
      "w-full transition-all duration-300 ease-in-out", 
      isFocused ? "md:flex-1" : "md:max-w-md",
      className
    )}>
      <form onSubmit={handleSearch} className="relative">
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
            placeholder="Search contacts..."
          />
          
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute inset-y-0 right-12 flex items-center pr-2"
            >
              <X size={16} className="text-gray-400 hover:text-gray-600" />
            </button>
          )}
          
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            <button
              type="button" 
              onClick={() => setShowFilters(true)}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                filterCount > 0 
                  ? "text-primary bg-primary/10 hover:bg-primary/20"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              )}
            >
              {filterCount > 0 ? (
                <div className="relative">
                  <Filter size={16} />
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {filterCount}
                  </span>
                </div>
              ) : (
                <Filter size={16} />
              )}
            </button>
          </div>
        </div>
        
        {filterCount > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 items-center">
            {getFilterSummary().map((summary, index) => (
              <Badge key={index} variant="outline" className="bg-primary/5 text-xs py-1">
                {summary}
              </Badge>
            ))}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="h-6 text-xs text-muted-foreground gap-1 hover:text-foreground"
            >
              <FilterX size={12} />
              Clear all
            </Button>
          </div>
        )}
      </form>

      <FilterDialog 
        open={showFilters} 
        onOpenChange={setShowFilters}
        onApplyFilters={applyFilters}
        currentFilters={activeFilters}
      />
    </div>
  );
};

export default SearchBar;
