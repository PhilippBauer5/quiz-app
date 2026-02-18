import { cn } from '../../lib/utils';

function Separator({ className, orientation = 'horizontal', ...props }) {
  return (
    <div
      role="separator"
      className={cn(
        'shrink-0 bg-gray-800',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className
      )}
      {...props}
    />
  );
}

export { Separator };
