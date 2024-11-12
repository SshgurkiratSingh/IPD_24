import useSWR from 'swr';

export interface Task {
  id: number;
  taskType: string;
  time?: number;
  repeatTime?: number;
  action: Action[];
  trigger?: Trigger;
  condition?: string;
  limit?: number;
  executedCount?: number;
}

interface Action {
  mqttTopic: string;
  value: string;
}

interface Trigger {
  topic: string;
  value: string;
}

interface UseTasksDataResult {
  tasks: Task[];
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const useTasksData = (): UseTasksDataResult => {
  const { data, error, mutate } = useSWR('/api/v2', fetcher, {
    refreshInterval: 5000, // Refresh every 5 seconds
    revalidateOnFocus: false, // Don't revalidate on window focus
  });

  return {
    tasks: data || [],
    isLoading: !error && !data,
    error,
    mutate,
  };
};