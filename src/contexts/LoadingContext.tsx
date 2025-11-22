import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ModernLoader from '../components/common/ModernLoader';

interface LoadingContextType {
  isLoading: boolean;
  message: string;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  setLoadingMessage: (message: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    message: '로딩 중...'
  });

  const startLoading = useCallback((message?: string) => {
    setLoadingState({
      isLoading: true,
      message: message || '로딩 중...'
    });
  }, []);

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

  const value: LoadingContextType = {
    isLoading: loadingState.isLoading,
    message: loadingState.message,
    startLoading,
    stopLoading,
    setLoadingMessage
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {loadingState.isLoading && (
        <ModernLoader 
          message={loadingState.message}
          size="medium"
          overlay={true}
        />
      )}
    </LoadingContext.Provider>
  );
};

export const useGlobalLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useGlobalLoading must be used within a LoadingProvider');
  }
  return context;
};

export default LoadingContext;
