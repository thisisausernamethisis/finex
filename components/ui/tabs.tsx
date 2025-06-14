import * as React from "react"
import { cn } from "@/lib/utils"

const Tabs = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    defaultValue?: string
    onValueChange?: (value: string) => void
  }
>(({ className, defaultValue, onValueChange, children, ...props }, ref) => {
  const [value, setValue] = React.useState(defaultValue || "")
  
  const handleValueChange = (newValue: string) => {
    setValue(newValue)
    onValueChange?.(newValue)
  }

  return (
    <div
      ref={ref}
      className={cn("w-full", className)}
      {...props}
    >
      {React.Children.map(children, child =>
        React.isValidElement(child)
          ? React.cloneElement(child, { value, onValueChange: handleValueChange } as any)
          : child
      )}
    </div>
  )
})
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string
    onValueChange?: (value: string) => void
  }
>(({ className, children, value, onValueChange, ...props }, ref) => (
  <div
    ref={ref}
    role="tablist"
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  >
    {React.Children.map(children, child =>
      React.isValidElement(child)
        ? React.cloneElement(child, { currentValue: value, onValueChange } as any)
        : child
    )}
  </div>
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    value: string
    currentValue?: string
    onValueChange?: (value: string) => void
  }
>(({ className, children, value, currentValue, onValueChange, ...props }, ref) => {
  const isSelected = currentValue === value;
  const panelId = `tabpanel-${value}`;
  const tabId = `tab-${value}`;

  return (
    <button
      ref={ref}
      id={tabId}
      role="tab"
      type="button"
      aria-selected={isSelected}
      aria-controls={panelId}
      tabIndex={isSelected ? 0 : -1}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isSelected
          ? "bg-background text-foreground shadow-sm"
          : "hover:bg-background/50",
        className
      )}
      onClick={() => onValueChange?.(value)}
      {...props}
    >
      {children}
    </button>
  );
})
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string
    currentValue?: string
  }
>(({ className, children, value, currentValue, ...props }, ref) => {
  if (currentValue !== value) return null
  
  const panelId = `tabpanel-${value}`;
  const tabId = `tab-${value}`;
  
  return (
    <div
      ref={ref}
      id={panelId}
      role="tabpanel"
      aria-labelledby={tabId}
      tabIndex={0}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent } 