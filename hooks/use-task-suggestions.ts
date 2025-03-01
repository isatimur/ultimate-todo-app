import { useState } from 'react';
import { Task } from '@/lib/types';
import { toast } from 'sonner';

export function useTaskSuggestions() {
  const [isLoading, setIsLoading] = useState(false);

  const getAISuggestions = async (input: string): Promise<Partial<Task>[]> => {
    if (!input.trim()) return [];
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/task-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        throw new Error('Failed to get suggestions');
      }

      const data = await response.json();
      return data.suggestions;
    } catch (error) {
      console.error('Error getting task suggestions:', error);
      toast.error('Failed to get task suggestions');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getAISuggestions,
    isLoading,
  };
} 