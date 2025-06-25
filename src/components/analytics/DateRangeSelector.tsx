
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CalendarIcon } from 'lucide-react';
import { format, subDays, subWeeks, subMonths, subYears } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface DateRangeSelectorProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  dateRange,
  onDateRangeChange,
  className = ""
}) => {
  const [showCustomRange, setShowCustomRange] = React.useState(false);

  const handleRangeSelect = (range: string) => {
    const today = new Date();
    
    switch (range) {
      case 'week':
        onDateRangeChange({
          from: subWeeks(today, 1),
          to: today,
        });
        setShowCustomRange(false);
        break;
      case 'month':
        onDateRangeChange({
          from: subMonths(today, 1),
          to: today,
        });
        setShowCustomRange(false);
        break;
      case 'year':
        onDateRangeChange({
          from: subYears(today, 1),
          to: today,
        });
        setShowCustomRange(false);
        break;
      case 'custom':
        setShowCustomRange(true);
        break;
    }
  };

  const getSelectedRangeLabel = () => {
    if (!dateRange?.from || !dateRange?.to) return 'Select Date Range';
    
    const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 7) return 'Past Week';
    if (daysDiff <= 31) return 'Past Month';
    if (daysDiff <= 365) return 'Past Year';
    
    return `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`;
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {getSelectedRangeLabel()}
            <CalendarIcon className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleRangeSelect("week")}>Past Week</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleRangeSelect("month")}>Past Month</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleRangeSelect("year")}>Past Year</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleRangeSelect("custom")}>Custom Range</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showCustomRange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
