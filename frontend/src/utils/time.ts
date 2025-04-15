export const convertToSeconds = (value: number, unit: 'hours' | 'minutes' | 'seconds'): number => {
  switch (unit) {
    case 'hours':
      return Math.round(value * 3600);
    case 'minutes':
      return Math.round(value * 60);
    case 'seconds':
      return Math.round(value);
  }
};

export const convertFromSeconds = (seconds: number, unit: 'hours' | 'minutes' | 'seconds'): number => {
  switch (unit) {
    case 'hours':
      return Number((seconds / 3600).toFixed(2));
    case 'minutes':
      return Number((seconds / 60).toFixed(2));
    case 'seconds':
      return seconds;
  }
};

export const formatRemainingTime = (seconds: number): string => {
  if (seconds <= 0) return '00:00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}; 