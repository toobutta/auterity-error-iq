// Shared color palette for three-system architecture
export const AuterityColors = {
  primary: {
    autmatrix: "#0ea5e9", // Blue - workflow focus
    neuroweaver: "#8b5cf6", // Purple - AI/ML focus
    relaycore: "#10b981", // Green - routing/optimization
  },
  status: {
    active: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    pending: "#6b7280",
  },
  departments: {
    sales: "#3b82f6",
    service: "#8b5cf6",
    parts: "#f97316",
    finance: "#1f2937",
  },
};

export type AuterityColorSystem = typeof AuterityColors;
