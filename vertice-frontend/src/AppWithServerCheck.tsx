import React from 'react';
import LoadingScreen from './components/LoadingScreen';
import { useServerConnection } from './hooks/useServerConnection';
import App from './App';

/**
 * AppWithServerCheck - Wrapper component that ensures server connectivity
 * before rendering the main application
 */
const AppWithServerCheck: React.FC = () => {
  const { status, serverUrl, error, retry, isReady } = useServerConnection();

  // Show loading screen while not ready
  if (!isReady) {
    return (
      <LoadingScreen
        status={status}
        serverUrl={serverUrl}
        error={error || undefined}
        onRetry={status === 'error' ? retry : undefined}
      />
    );
  }

  // Server is ready, render main app
  return <App />;
};

export default AppWithServerCheck;
