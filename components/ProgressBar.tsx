
import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value }) => {
  const normalizedValue = Math.max(0, Math.min(100, value));
  
  const getColor = () => {
    if (normalizedValue >= 100) return 'bg-red-500';
    if (normalizedValue > 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="w-full bg-border dark:bg-dark-border rounded-full h-2.5">
      <div
        className={`${getColor()} h-2.5 rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${normalizedValue}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;
