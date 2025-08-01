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
    <div className="flex items-center justify-between py-4 px-3 rounded-lg hover:bg-muted/30 transition-colors duration-200 min-h-[72px]">
      <div className="flex items-center space-y-0 gap-4">
        <div className="flex items-center justify-center w-10 h-10 flex-shrink-0">
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
      
      <div className="flex-shrink-0 flex items-center">
        {type === 'switch' && !options.length && (
          <CustomSwitch
            checked={value}
            onChange={onChange}
          />
        )}
        
        {type === 'switch' && options.length === 2 && (
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium transition-colors duration-200 ${
              !value ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {options[0].label}
            </span>
            <CustomSwitch
              checked={value}
              onChange={onChange}
            />
            <span className={`text-sm font-medium transition-colors duration-200 ${
              value ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {options[1].label}
            </span>
          </div>
        )}
        
        {type === 'select' && (
          <Select 
            value={value} 
            onValueChange={onChange}
            className="w-[160px]"
            style={{ fontFamily: options.find(opt => opt.value === value)?.fontFamily }}
          >
            {options.map(option => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                style={{ fontFamily: option.fontFamily }}
              >
                {option.label}
              </SelectItem>
            ))}
          </Select>
        )}
        
        {type === 'color' && (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-12 h-8 rounded-md border border-border cursor-pointer hover:border-border/60 transition-colors"
              style={{ backgroundColor: value }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
