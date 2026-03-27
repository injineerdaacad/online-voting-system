import React from 'react';
import InputField from './InputField';
import { Phone } from 'lucide-react';

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helpText?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  error,
  helpText,
  ...props
}) => {
  return (
    <InputField
      type="tel"
      label={label}
      error={error}
      helpText={helpText}
      leftIcon={<Phone className="h-4 w-4 text-gray-400" />}
      placeholder="+1 (555) 123-4567"
      {...props}
    />
  );
};

export default PhoneInput;