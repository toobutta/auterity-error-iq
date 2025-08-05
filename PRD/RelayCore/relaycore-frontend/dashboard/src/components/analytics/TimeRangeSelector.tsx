import React, { useState } from 'react';
import styled from 'styled-components';
import { Button } from '@relaycore/design-system';
import { subDays, subHours, subMonths, format } from 'date-fns';

export type TimeRange = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface TimeRangeSelectorProps {
  onChange: (range: { start: Date; end: Date; preset?: TimeRange }) => void;
  initialRange?: TimeRange;
}

const Container = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const DateRangeDisplay = styled.div`
  margin-left: 16px;
  font-size: 14px;
  color: #666;
`;

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  onChange,
  initialRange = 'day',
}) => {
  const [activeRange, setActiveRange] = useState<TimeRange>(initialRange);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
    const end = new Date();
    let start;
    
    switch (initialRange) {
      case 'hour':
        start = subHours(end, 1);
        break;
      case 'day':
        start = subDays(end, 1);
        break;
      case 'week':
        start = subDays(end, 7);
        break;
      case 'month':
        start = subMonths(end, 1);
        break;
      case 'quarter':
        start = subMonths(end, 3);
        break;
      case 'year':
        start = subMonths(end, 12);
        break;
      default:
        start = subDays(end, 1);
    }
    
    return { start, end };
  });

  const handleRangeChange = (range: TimeRange) => {
    const end = new Date();
    let start;
    
    switch (range) {
      case 'hour':
        start = subHours(end, 1);
        break;
      case 'day':
        start = subDays(end, 1);
        break;
      case 'week':
        start = subDays(end, 7);
        break;
      case 'month':
        start = subMonths(end, 1);
        break;
      case 'quarter':
        start = subMonths(end, 3);
        break;
      case 'year':
        start = subMonths(end, 12);
        break;
      default:
        return; // Don't handle custom here
    }
    
    setActiveRange(range);
    setDateRange({ start, end });
    onChange({ start, end, preset: range });
  };

  const formatDateRange = () => {
    const { start, end } = dateRange;
    return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
  };

  return (
    <Container>
      <ButtonGroup>
        <Button
          size="small"
          variant={activeRange === 'hour' ? 'primary' : 'tertiary'}
          onClick={() => handleRangeChange('hour')}
        >
          1H
        </Button>
        <Button
          size="small"
          variant={activeRange === 'day' ? 'primary' : 'tertiary'}
          onClick={() => handleRangeChange('day')}
        >
          24H
        </Button>
        <Button
          size="small"
          variant={activeRange === 'week' ? 'primary' : 'tertiary'}
          onClick={() => handleRangeChange('week')}
        >
          7D
        </Button>
        <Button
          size="small"
          variant={activeRange === 'month' ? 'primary' : 'tertiary'}
          onClick={() => handleRangeChange('month')}
        >
          30D
        </Button>
        <Button
          size="small"
          variant={activeRange === 'quarter' ? 'primary' : 'tertiary'}
          onClick={() => handleRangeChange('quarter')}
        >
          90D
        </Button>
        <Button
          size="small"
          variant={activeRange === 'year' ? 'primary' : 'tertiary'}
          onClick={() => handleRangeChange('year')}
        >
          1Y
        </Button>
      </ButtonGroup>
      <DateRangeDisplay>{formatDateRange()}</DateRangeDisplay>
    </Container>
  );
};