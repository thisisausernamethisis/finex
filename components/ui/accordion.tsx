import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccordionContextProps {
  value?: string | string[]
  onValueChange?: (value: string | string[] | undefined) => void
  type: "single" | "multiple"
  collapsible?: boolean
}

const AccordionContext = React.createContext<AccordionContextProps | null>(null)

interface AccordionProps {
  type: "single" | "multiple"
  value?: string | string[]
  onValueChange?: (value: string | string[] | undefined) => void
  collapsible?: boolean
  className?: string
  children: React.ReactNode
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ type, value, onValueChange, collapsible = false, className, children, ...props }, ref) => {
    return (
      <AccordionContext.Provider 
        value={{ 
          value, 
          onValueChange, 
          type,
          collapsible
        }}
      >
        <div 
          ref={ref} 
          className={cn("divide-y divide-border", className)} 
          role="region"
          aria-label="Accordion content"
          {...props}
        >
          {children}
        </div>
      </AccordionContext.Provider>
    )
  }
)
Accordion.displayName = "Accordion"

interface AccordionItemProps {
  value: string
  className?: string
  disabled?: boolean
  children: React.ReactNode
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, className, disabled = false, children, ...props }, ref) => {
    return (
      <div 
        ref={ref} 
        className={cn("border-b", className)} 
        data-state={disabled ? "disabled" : undefined}
        {...props}
      >
        {children}
      </div>
    )
  }
)
AccordionItem.displayName = "AccordionItem"

interface AccordionTriggerProps extends React.ComponentPropsWithoutRef<"button"> {
  className?: string
  children: React.ReactNode
}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(AccordionContext)
    const parentItem = React.useContext(AccordionItemContext)
    const itemValue = parentItem?.value
    
    if (!context || !itemValue) {
      throw new Error("AccordionTrigger must be used within AccordionItem and Accordion")
    }

    const isOpen = React.useMemo(() => {
      if (context.type === "single") {
        return context.value === itemValue
      } else {
        return Array.isArray(context.value) && context.value.includes(itemValue)
      }
    }, [context.value, context.type, itemValue])

    const handleClick = () => {
      if (!context.onValueChange) return
      
      if (context.type === "single") {
        const newValue = isOpen && context.collapsible ? undefined : itemValue
        context.onValueChange(newValue)
      } else {
        const currentValues = Array.isArray(context.value) ? context.value : []
        const newValues = isOpen 
          ? currentValues.filter(v => v !== itemValue)
          : [...currentValues, itemValue]
        context.onValueChange(newValues)
      }
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        handleClick()
      }
    }

    const contentId = `accordion-content-${itemValue}`
    const triggerId = `accordion-trigger-${itemValue}`

    return (
      <button
        ref={ref}
        id={triggerId}
        type="button"
        className={cn(
          "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&[data-state=open]>svg]:rotate-180",
          className
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-controls={contentId}
        data-state={isOpen ? "open" : "closed"}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
      </button>
    )
  }
)
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionItemContext = React.createContext<{ value: string; disabled?: boolean } | null>(null)

interface AccordionContentProps extends React.ComponentPropsWithoutRef<"div"> {
  className?: string
  children: React.ReactNode
}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(AccordionContext)
    const parentItem = React.useContext(AccordionItemContext)
    const itemValue = parentItem?.value
    
    if (!context || !itemValue) {
      throw new Error("AccordionContent must be used within AccordionItem and Accordion")
    }

    const isOpen = React.useMemo(() => {
      if (context.type === "single") {
        return context.value === itemValue
      } else {
        return Array.isArray(context.value) && context.value.includes(itemValue)
      }
    }, [context.value, context.type, itemValue])

    const contentId = `accordion-content-${itemValue}`
    const triggerId = `accordion-trigger-${itemValue}`

    return (
      <div
        ref={ref}
        id={contentId}
        role="region"
        aria-labelledby={triggerId}
        className={cn(
          "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
          className
        )}
        data-state={isOpen ? "open" : "closed"}
        style={{
          display: isOpen ? "block" : "none"
        }}
        {...props}
      >
        <div className="pb-4 pt-0">
          {children}
        </div>
      </div>
    )
  }
)
AccordionContent.displayName = "AccordionContent"

// Enhanced AccordionItem that provides context
const EnhancedAccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, className, disabled = false, children, ...props }, ref) => {
    return (
      <AccordionItemContext.Provider value={{ value, disabled }}>
        <AccordionItem 
          ref={ref} 
          value={value} 
          className={className} 
          disabled={disabled}
          {...props}
        >
          {children}
        </AccordionItem>
      </AccordionItemContext.Provider>
    )
  }
)
EnhancedAccordionItem.displayName = "AccordionItem"

export { 
  Accordion, 
  EnhancedAccordionItem as AccordionItem, 
  AccordionTrigger, 
  AccordionContent 
} 