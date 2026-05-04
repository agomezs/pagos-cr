// Gluestack UI v3 Switch — do not edit manually.
import React from 'react';
import { Switch as RNSwitch } from 'react-native';

type SwitchProps = {
  value: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
};

const Switch = React.forwardRef<RNSwitch, SwitchProps>(
  function Switch({ value, onValueChange, disabled = false }, ref) {
    return (
      <RNSwitch
        ref={ref}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
        thumbColor="#ffffff"
      />
    );
  }
);

Switch.displayName = 'Switch';
export { Switch };
