import * as React from "react"
import { ChevronDown } from "lucide-react"

interface AccordionContextProps {
  value?: string
  onValueChange?: (value: string | undefined) => void
  type: "single" | "multiple"
}

const AccordionContext = React.createContext<AccordionContextProps | null>(null)

interface AccordionProps {
  type: "single" | "multiple"
  value?: string | string[]
  onValueChange?: (value: string | string[] | undefined) => void
  className?: string
  children: React.ReactNode
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ type, value, onValueChange, className, children, ...props }, ref) => {
    const singleValue = type === "single" ? (value as string) : undefined
    const singleOnValueChange = type === "single" 
      ? (onValueChange as ((value: string | undefined) => void)) 
      : undefined

    return (
      <AccordionContext.Provider 
        value={{ 
          value: singleValue, 
          onValueChange: singleOnValueChange, 
          type 
        }}
      >
        <div ref={ref} className={className} {...props}>
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
  children: React.ReactNode
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    )
  }
)
AccordionItem.displayName = "AccordionItem"

interface AccordionTriggerProps {
  className?: string
  children: React.ReactNode
}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(AccordionContext)
    const [isOpen, setIsOpen] = React.useState(false)
    
    const parentItem = React.useContext(AccordionItemContext)
    const itemValue = parentItem?.value
    
    React.useEffect(() => {
      if (context?.value && itemValue) {
        setIsOpen(context.value === itemValue)
      }
    }, [context?.value, itemValue])

    const handleClick = () => {
      if (context?.onValueChange && itemValue) {
        const newValue = isOpen ? undefined : itemValue
        context.onValueChange(newValue)
        setIsOpen(!isOpen)
      }
    }

    return (
      <button
        ref={ref}
        className={`flex flex-1 items-center justify-between py-4 font-medium transition-all [&[data-state=open]>svg]:rotate-180 ${className}`}
        onClick={handleClick}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
      </button>
    )
  }
)
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionItemContext = React.createContext<{ value: string } | null>(null)

interface AccordionContentProps {
  className?: string
  children: React.ReactNode
}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(AccordionContext)
    const parentItem = React.useContext(AccordionItemContext)
    const itemValue = parentItem?.value
    
    const isOpen = context?.value === itemValue

    return (
      <div
        ref={ref}
        className={`overflow-hidden text-sm transition-all ${
          isOpen ? 'animate-accordion-down' : 'animate-accordion-up'
        } ${className}`}
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
  ({ value, className, children, ...props }, ref) => {
    return (
      <AccordionItemContext.Provider value={{ value }}>
        <AccordionItem ref={ref} value={value} className={className} {...props}>
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