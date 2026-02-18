import { cn } from '../../lib/utils';

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-gray-800', className)}
      {...props}
    />
  );
}

export { Skeleton };
