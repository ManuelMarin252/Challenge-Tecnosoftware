
import * as React from "react"
import { X } from "lucide-react"

const DialogContext = React.createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
} | null>(null)

export const Dialog = ({ 
  children, 
  open, 
  onOpenChange 
}: { 
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  
  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  return (
    <DialogContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

export const DialogTrigger = ({ asChild, children }: { asChild?: boolean, children: React.ReactNode }) => {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error("DialogTrigger must be used within Dialog")
  
  const handleClick = () => context.setIsOpen(true)

  if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, { onClick: handleClick })
  }

  return <div onClick={handleClick}>{children}</div>
}

export const DialogContent = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error("DialogContent must be used within Dialog")
  
  if (!context.isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`relative bg-background p-6 rounded-lg shadow-lg w-full max-w-lg ${className}`}>
        <button 
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            onClick={() => context.setIsOpen(false)}
        >
            <X size={18} />
        </button>
        {children}
      </div>
    </div>
  )
}

export const DialogHeader = ({ children }: { children: React.ReactNode }) => (
    <div className="mb-4 text-lg font-semibold">{children}</div>
)

export const DialogTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-lg font-semibold leading-none tracking-tight">{children}</h3>
)

export const DialogDescription = ({ children }: { children: React.ReactNode }) => (
    <p className="text-sm text-muted-foreground mt-2">{children}</p>
)

export const DialogFooter = ({ children }: { children: React.ReactNode }) => (
    <div className="flex justify-end space-x-2 mt-4">{children}</div>
)
