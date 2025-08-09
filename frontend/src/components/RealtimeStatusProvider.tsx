import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface Status {
  agents: Record<string, { status: string; lastSeen: string }>;
  servers: Record<string, { status: string; lastSeen: string }>;
  workflows: Record<string, { status: string; updated: string }>;
}

interface RealtimeStatusContextProps {
  status: Status | null;
  lastUpdate: Date | null;
}

const RealtimeStatusContext = createContext<RealtimeStatusContextProps>({ status: null, lastUpdate: null });

export const useRealtimeStatus = () => useContext(RealtimeStatusContext);

export const RealtimeStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<Status | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let interval: NodeJS.Timeout;

    const connect = () => {
      ws = new WebSocket('wss://localhost:8000/ws/status');
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setStatus(data.status);
          setLastUpdate(new Date());
        } catch (e) {
          // Ignore parse errors
        }
      };
      ws.onclose = () => {
        // Try to reconnect after 2s
        setTimeout(connect, 2000);
      };
    };
    connect();
    // Fallback polling every 30s
    interval = setInterval(async () => {
      try {
        const res = await fetch('/api/v1/health');
        const data = await res.json();
        setStatus(data.services);
        setLastUpdate(new Date());
      } catch {}
    }, 30000);
    return () => {
      ws?.close();
      clearInterval(interval);
    };
  }, []);

  return (
    <RealtimeStatusContext.Provider value={{ status, lastUpdate }}>
      {children}
    </RealtimeStatusContext.Provider>
  );
};
