import React from 'react';

interface IdeaEmptyStateProps {
  message: string;
  actionButton?: React.ReactNode;
}

export function IdeaEmptyState({ message, actionButton }: IdeaEmptyStateProps) {
  return (
    <div className="border border-dashed border-border rounded-lg py-12 text-center space-y-3">
      <p className="text-sm text-muted-foreground">{message}</p>
      {actionButton}
    </div>
  );
}
