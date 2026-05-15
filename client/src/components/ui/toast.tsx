import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ToastProvider = ToastPrimitive.Provider;

export const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed bottom-4 right-4 z-[100] flex max-h-screen w-full max-w-sm flex-col gap-2 p-2 outline-none',
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = 'ToastViewport';

const toastVariants = cva(
  'pointer-events-auto relative flex w-full items-start justify-between gap-3 overflow-hidden rounded-md border p-4 shadow-lg ' +
    'data-[state=open]:animate-slide-in data-[state=closed]:animate-fade-in',
  {
    variants: {
      variant: {
        default: 'border-border bg-surface text-fg',
        success: 'border-success/40 bg-surface text-fg',
        error: 'border-danger/40 bg-surface text-fg',
        warning: 'border-warning/40 bg-surface text-fg',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface ToastProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root>, VariantProps<typeof toastVariants> {}

export const Toast = React.forwardRef<React.ElementRef<typeof ToastPrimitive.Root>, ToastProps>(
  ({ className, variant, ...props }, ref) => (
    <ToastPrimitive.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />
  ),
);
Toast.displayName = 'Toast';

export const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title ref={ref} className={cn('text-sm font-semibold', className)} {...props} />
));
ToastTitle.displayName = 'ToastTitle';

export const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description ref={ref} className={cn('text-sm text-fg-muted mt-1', className)} {...props} />
));
ToastDescription.displayName = 'ToastDescription';

export const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn(
      'absolute right-2 top-2 rounded-md p-1 text-fg-muted opacity-70 transition hover:opacity-100',
      className,
    )}
    aria-label="Close"
    {...props}
  >
    <X className="h-3.5 w-3.5" />
  </ToastPrimitive.Close>
));
ToastClose.displayName = 'ToastClose';
