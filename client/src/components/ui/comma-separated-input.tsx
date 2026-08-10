import React from 'react';
import { Input } from '@/components/ui/input';

interface CommaSeparatedInputProps {
  value: string[] | undefined;
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export function CommaSeparatedInput({
  value,
  onChange,
  placeholder,
  className,
  required
}: CommaSeparatedInputProps) {
  const inputValue = value?.join(', ') || '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const values = newValue.split(',').map(v => v.trim()).filter(v => v.length > 0);
    onChange(values);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === ' ') {
      e.stopPropagation();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === ' ') {
      e.stopPropagation();
    }
  };

  return (
    <div>      <Input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className={className}
        required={required}
        pattern="[^]*"
        inputMode="text"
        data-comma-separated="true"
      />
      <p className="text-xs text-gray-400 mt-1">Separate with commas</p>
    </div>
  );
}
