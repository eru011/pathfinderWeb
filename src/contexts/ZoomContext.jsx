import React, { createContext, useContext, useState } from 'react';

const ZoomContext = createContext();

export function ZoomProvider({ children }) {
  const [zoomEnabled, setZoomEnabled] = useState(false);
  const [defaultZoom, setDefaultZoom] = useState(1);

  return (
    <ZoomContext.Provider value={{
      zoomEnabled,
      setZoomEnabled,
      defaultZoom,
      setDefaultZoom
    }}>
      {children}
    </ZoomContext.Provider>
  );
}

export function useZoom() {
  const context = useContext(ZoomContext);
  if (context === undefined) {
    throw new Error('useZoom must be used within a ZoomProvider');
  }
  return context;
} 