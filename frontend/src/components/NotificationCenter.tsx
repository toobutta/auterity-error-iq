import React, { useState, useEffect } from "react";

interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  timestamp: Date;
}

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Example: Listen to a global event bus or WebSocket for notifications
    const ws = new WebSocket("wss://localhost:8000/ws/notifications");
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setNotifications((prev) => [
          {
            id: data.id || Date.now().toString(),
            type: data.type,
            message: data.message,
            timestamp: new Date(),
          },
          ...prev.slice(0, 4),
        ]);
      } catch (error) {

      }
    };
    return () => ws.close();
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`px-4 py-3 rounded shadow-lg text-white transition-all ${
            n.type === "success"
              ? "bg-green-600"
              : n.type === "error"
                ? "bg-red-600"
                : n.type === "warning"
                  ? "bg-yellow-500"
                  : "bg-blue-600"
          }`}
        >
          <div className="font-semibold">{n.message}</div>
          <div className="text-xs opacity-70">
            {n.timestamp.toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  );
};


