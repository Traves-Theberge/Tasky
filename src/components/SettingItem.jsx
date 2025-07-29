import React from 'react';
import CustomSwitch from './ui/CustomSwitch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

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
    <div className="flex items-center justify-between py-4 px-1">
      <div className="flex items-center space-y-0 gap-4">
        <div className="text-2xl flex-shrink-0">
          {icon}
        </div>
        <div className="flex flex-col">
          <div className="text-base font-medium text-foreground">
            {title}
          </div>
          {description && (
            <div className="text-sm text-muted-foreground">
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
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};
