import useSWR from 'swr';

export interface RoomData {
  topic: string;
  value: string;
}

interface UseRoomDataResult {
  roomData: RoomData[];
  isLoading: boolean;
  error: Error | null;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

const useRoomData = (): UseRoomDataResult => {
  const { data, error } = useSWR('http://192.168.1.100:2500/api/v1/logs', fetcher, {
    refreshInterval: 5000, // Refresh every 5 seconds
    revalidateOnFocus: false, // Don't revalidate on window focus
  });

  return {
    roomData: data || [],
    isLoading: !error && !data,
    error: error,
  };
};

export default useRoomData;