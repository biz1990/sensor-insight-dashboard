
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { DateRange } from 'react-day-picker';

interface DateModeSwitcherProps {
  mode: 'latest' | 'daily' | 'range';
  onModeChange: (mode: 'latest' | 'daily' | 'range') => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

const DateModeSwitcher: React.FC<DateModeSwitcherProps> = ({
  mode,
  onModeChange,
  dateRange,
  onDateRangeChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <ToggleGroup type="single" value={mode} onValueChange={(value) => {
        if (value) onModeChange(value as 'latest' | 'daily' | 'range');
      }}>
        <ToggleGroupItem value="latest" aria-label="Show latest readings">
          Latest
        </ToggleGroupItem>
        <ToggleGroupItem value="daily" aria-label="Show daily readings">
          Daily
        </ToggleGroupItem>
        <ToggleGroupItem value="range" aria-label="Show date range readings">
          Date Range
        </ToggleGroupItem>
      </ToggleGroup>
      
      {mode === 'range' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "justify-start text-left font-normal",
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
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default DateModeSwitcher;
