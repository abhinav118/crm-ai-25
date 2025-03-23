
import React, { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SearchBarProps = {
  onSearch: (query: string) => void;
  className?: string;
  isActive?: boolean;
  onActiveChange?: (isActive: boolean) => void;
};

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  className,
  isActive = false,
  onActiveChange = () => {}
}) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };
  
  const clearSearch = () => {
    setQuery('');
    onSearch('');
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
              onClick={() => setShowFilters(!showFilters)}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Filter size={16} />
            </button>
          </div>
        </div>
        
        {showFilters && (
          <div className="absolute mt-2 w-full bg-white rounded-md shadow-lg border border-gray-200 p-4 z-10 animate-fade-in">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700">Status</label>
                  <select className="w-full text-sm border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary">
                    <option value="">Any Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700">Date Added</label>
                  <select className="w-full text-sm border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary">
                    <option value="">Any Time</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowFilters(false)}
                >
                  Cancel
                </Button>
                <Button type="button" size="sm">Apply Filters</Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchBar;
