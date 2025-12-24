import * as React from "react";

import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  label?: string;
  onChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, checked, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.checked);
    };

    return (
      <label className="flex items-center gap-3 cursor-pointer touch-manipulation">
        <input
          type="checkbox"
          className={cn("peer sr-only", className)}
          ref={ref}
          checked={checked}
          onChange={handleChange}
          {...props}
        />
        <div className="relative h-6 w-11 rounded-full bg-input border border-border transition-colors peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-background after:transition-all peer-checked:after:translate-x-5" />
        {label && <span className="text-sm text-foreground">{label}</span>}
      </label>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };

