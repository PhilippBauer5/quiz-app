import { cn } from '../../lib/utils';

function Badge({ className, variant = 'default', ...props }) {
  const variantStyles = {
    default: 'bg-blue-600/20 text-blue-400 border-blue-800',
    secondary: 'bg-gray-800 text-gray-300 border-gray-700',
    success: 'bg-green-600/20 text-green-400 border-green-800',
    destructive: 'bg-red-600/20 text-red-400 border-red-800',
    warning: 'bg-yellow-600/20 text-yellow-400 border-yellow-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
