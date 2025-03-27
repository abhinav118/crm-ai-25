import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X, Pencil, Trash2 } from 'lucide-react';
import PhoneFilter from './PhoneFilter';
import EmailFilter from './EmailFilter';
import TagFilter from './TagFilter';
import CreatedFilter from './CreatedFilter';

export type FilterType = 'main' | 'phone' | 'email' | 'tag' | 'created';

export type FilterValue = {
  type: string;
  operator: string;
  value: string | string[] | number | null;
  unit?: string;
};

export type FilterState = {
  phone?: FilterValue;
  email?: FilterValue;
  tag?: FilterValue;
  created?: FilterValue;
};

type FilterDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters: (filters: FilterState) => void;
  currentFilters: FilterState;
  totalCount?: number;
};

const FilterDialog: React.FC<FilterDialogProps> = ({
  open,
  onOpenChange,
  onApplyFilters,
  currentFilters,
  totalCount = 0
}) => {
  const [currentView, setCurrentView] = useState<FilterType>('main');
  const [filters, setFilters] = useState<FilterState>(currentFilters || {});

  const handleBack = () => {
    setCurrentView('main');
  };

  const handleFilterUpdate = (key: keyof FilterState, value: FilterValue | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleRemoveFilter = (key: keyof FilterState) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onOpenChange(false);
  };

  const handleResetFilters = () => {
    setFilters({});
    onApplyFilters({});
    onOpenChange(false);
  };

  const getFilterCount = () => {
    return Object.keys(filters).filter(key => filters[key as keyof FilterState] !== undefined).length;
  };

  const getFilterLabel = (type: keyof FilterState): string => {
    if (!filters[type]) return '';
    
    const { operator, value } = filters[type]!;
    
    switch (type) {
      case 'email':
        if (operator === 'is' && value) return `Email: Is ${value}`;
        if (operator === 'isNot' && value) return `Email: Is not ${value}`;
        if (operator === 'isEmpty') return 'Email: Is empty';
        if (operator === 'isNotEmpty') return 'Email: Is not empty';
        break;
      case 'phone':
        if (operator === 'is' && value) return `Phone: Is ${value}`;
        if (operator === 'isNot' && value) return `Phone: Is not ${value}`;
        if (operator === 'isEmpty') return 'Phone: Is empty';
        if (operator === 'isNotEmpty') return 'Phone: Is not empty';
        break;
      case 'tag':
        if (operator === 'is' && value) return `Tag: Is ${value}`;
        if (operator === 'isNot' && value) return `Tag: Is not ${value}`;
        if (operator === 'isEmpty') return 'Tag: Is empty';
        if (operator === 'isNotEmpty') return 'Tag: Is not empty';
        if (operator === 'anyOf' && value) return `Tag: Is any of ${value}`;
        break;
      case 'created':
        if (operator === 'moreThan' && value !== null) {
          const unit = filters[type]?.unit || '';
          return `Created: More than ${value} ${unit} ago`;
        }
        if (operator === 'lessThan' && value !== null) {
          const unit = filters[type]?.unit || '';
          return `Created: Less than ${value} ${unit} ago`;
        }
        if (operator === 'range') return 'Created: In date range';
        break;
    }
    
    return '';
  };

  const renderAppliedFilters = () => {
    const filterKeys = Object.keys(filters).filter(
      key => filters[key as keyof FilterState] !== undefined
    ) as Array<keyof FilterState>;
    
    if (filterKeys.length === 0) return null;
    
    return (
      <div className="border-t py-4 space-y-3">
        {filterKeys.map(key => (
          <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="font-medium">{getFilterLabel(key)}</div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setCurrentView(key);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => handleRemoveFilter(key)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case 'phone':
        return (
          <PhoneFilter 
            value={filters.phone} 
            onChange={(value) => handleFilterUpdate('phone', value)} 
          />
        );
      case 'email':
        return (
          <EmailFilter 
            value={filters.email} 
            onChange={(value) => handleFilterUpdate('email', value)} 
          />
        );
      case 'tag':
        return (
          <TagFilter 
            value={filters.tag} 
            onChange={(value) => handleFilterUpdate('tag', value)} 
          />
        );
      case 'created':
        return (
          <CreatedFilter 
            value={filters.created} 
            onChange={(value) => handleFilterUpdate('created', value)} 
          />
        );
      default:
        return (
          <div className="space-y-6 py-6">
            <div className="text-muted-foreground text-sm mb-2">
              {getFilterCount() > 0 ? 
                `Showing ${totalCount.toLocaleString()} records` : 
                "Apply filters to contacts"}
            </div>
            
            {renderAppliedFilters()}
            
            <div className="space-y-4">
              <FilterOption 
                title="Phone" 
                active={!!filters.phone}
                onClick={() => setCurrentView('phone')} 
              />
              <FilterOption 
                title="Email" 
                active={!!filters.email}
                onClick={() => setCurrentView('email')} 
              />
              <FilterOption 
                title="Tag" 
                active={!!filters.tag}
                onClick={() => setCurrentView('tag')} 
              />
              <FilterOption 
                title="Created" 
                active={!!filters.created}
                onClick={() => setCurrentView('created')} 
              />
            </div>
            
            <div className="flex justify-between space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setFilters({})}
                className="gap-1.5"
              >
                Clear Filters
              </Button>
              <Button onClick={handleApplyFilters}>Apply Filters</Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center">
            {currentView !== 'main' && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleBack}
                className="mr-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <SheetTitle className="text-xl">
              {currentView === 'main' 
                ? 'Filters' 
                : currentView.charAt(0).toUpperCase() + currentView.slice(1)}
            </SheetTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-5 w-5" />
          </Button>
        </SheetHeader>
        
        {renderContent()}
      </SheetContent>
    </Sheet>
  );
};

const FilterOption: React.FC<{ 
  title: string; 
  active: boolean;
  onClick: () => void 
}> = ({ title, active, onClick }) => {
  return (
    <div 
      className={`px-4 py-3 border rounded-md flex justify-between items-center cursor-pointer transition-colors ${
        active ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'
      }`}
      onClick={onClick}
    >
      <span className="font-medium">{title}</span>
      {active && <div className="w-2 h-2 rounded-full bg-primary" />}
    </div>
  );
};

export default FilterDialog;
