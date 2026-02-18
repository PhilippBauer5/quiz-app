import { AlertCircle, FileQuestion, Inbox } from 'lucide-react';
import { Card, CardContent } from './Card';

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  children,
}) {
  return (
    <Card className="border-dashed border-2 border-gray-700">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-gray-800 p-4 mb-4">
          <Icon className="h-8 w-8 text-gray-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-300 mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 mb-4 max-w-sm">{description}</p>
        )}
        {children}
      </CardContent>
    </Card>
  );
}

export function ErrorState({ message, children }) {
  return (
    <div className="rounded-lg border border-red-800 bg-red-950/30 px-4 py-3 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-red-300">{message}</p>
        {children}
      </div>
    </div>
  );
}

export function LoadingState({ text = 'Wird geladen…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-blue-500 mb-4" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}
