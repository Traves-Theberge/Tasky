import React from 'react';
import CustomSwitch from './ui/CustomSwitch';
import { Select, SelectItem } from './ui/select';

export const SettingItem = ({ 
  icon, 
  title, 
  description, 
  type = 'switch', 
  value, 
  onChange, 
  options = [] 
}) => {
  return (
    <div className="flex items-center justify-between py-4 px-2 rounded-lg hover:bg-muted/30 transition-colors duration-200">
      <div className="flex items-center space-y-0 gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex-shrink-0">
          <span className="text-lg">{icon}</span>
        </div>
        <div className="flex flex-col">
          <div className="text-base font-medium text-foreground">
            {title}
          </div>
          {description && (
            <div className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-shrink-0">
        {type === 'switch' && (
          <CustomSwitch
            checked={value}
            onChange={onChange}
          />
        )}
        
        {type === 'select' && (
          <Select 
            value={value} 
            onValueChange={onChange}
            className="w-[160px]"
          >
            {options.map(option => (
              <SelectItem 
                key={option.value} 
                value={option.value}
              >
                {option.label}
              </SelectItem>
            ))}
          </Select>
        )}
      </div>
    </div>
  );
};
