import { useState, useCallback } from 'react';

interface LoadingState {
  isLoading: boolean;
  message: string;
}

export const useLoading = (initialMessage: string = '로딩 중...') => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    message: initialMessage
  });

  const startLoading = useCallback((message?: string) => {
    setLoadingState({
      isLoading: true,
      message: message || initialMessage
    });
  }, [initialMessage]);

  const stopLoading = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: false
    }));
  }, []);

  const setLoadingMessage = useCallback((message: string) => {
    setLoadingState(prev => ({
      ...prev,
      message
    }));
  }, []);

  return {
    isLoading: loadingState.isLoading,
    message: loadingState.message,
    startLoading,
    stopLoading,
    setLoadingMessage
  };
};

export default useLoading;
