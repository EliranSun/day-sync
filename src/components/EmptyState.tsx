interface EmptyStateProps {
  type: 'expected' | 'reality';
}

export function EmptyState({ type }: EmptyStateProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <p className="text-gray-300 dark:text-gray-600 text-sm text-center px-4">
        {type === 'expected'
          ? 'Tap a time slot to plan your day'
          : 'Tap a time slot to log what happened'}
      </p>
    </div>
  );
}
