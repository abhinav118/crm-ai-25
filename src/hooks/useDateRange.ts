
import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';

export const useDateRange = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  return {
    dateRange,
    setDateRange,
  };
};
