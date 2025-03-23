
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X } from 'lucide-react';
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
};

const FilterDialog: React.FC<FilterDialogProps> = ({
  open,
  onOpenChange,
  onApplyFilters,
  currentFilters
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

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onOpenChange(false);
  };

  const handleResetFilters = () => {
    setFilters({});
    onApplyFilters({});
    onOpenChange(false);
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
            <div className="text-muted-foreground text-sm">Apply filters to contacts</div>
            
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
            
            <div className="flex justify-end space-x-2 pt-4">
              {(filters.phone || filters.email || filters.tag || filters.created) && (
                <Button 
                  variant="outline" 
                  onClick={handleResetFilters}
                >
                  Reset
                </Button>
              )}
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
