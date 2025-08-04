import * as React from 'react';

export interface DropdownMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const DropdownMenu = React.forwardRef<HTMLDivElement, DropdownMenuProps>(
  ({ children, ...props }, ref) => {
    return (
      <div ref={ref} className="relative inline-block text-left" {...props}>
        {children}
      </div>
    );
  }
);
DropdownMenu.displayName = 'DropdownMenu';

export interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ className, ...props }, ref) => {
    return (
      <button ref={ref} className={`inline-flex items-center ${className || ''}`} {...props} />
    );
  }
);
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

export interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`absolute right-0 z-50 mt-2 w-56 rounded-md border bg-white shadow-lg ${className || ''}`}
        {...props}
      />
    );
  }
);
DropdownMenuContent.displayName = 'DropdownMenuContent';

export interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {}

const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`cursor-pointer px-4 py-2 text-sm hover:bg-gray-100 ${className || ''}`}
        {...props}
      />
    );
  }
);
DropdownMenuItem.displayName = 'DropdownMenuItem';

export interface DropdownMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {}

const DropdownMenuLabel = React.forwardRef<HTMLDivElement, DropdownMenuLabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`px-4 py-2 text-sm font-semibold text-gray-900 ${className || ''}`}
        {...props}
      />
    );
  }
);
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

export interface DropdownMenuSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, DropdownMenuSeparatorProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={`my-1 h-px bg-gray-200 ${className || ''}`} {...props} />;
  }
);
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};
