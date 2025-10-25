// Kiro Permissions System
export interface KiroRole {
  name: string;
  canView: string[];
}

export const kiroRoles: KiroRole[] = [
  {
    name: "admin",
    canView: [
      "error_dashboard",
      "stack_trace",
      "error_message",
      "retry_modal",
      "error_summary",
    ],
  },
  {
    name: "operator",
    canView: ["error_message", "retry_modal", "error_summary"],
  },
  {
    name: "guest",
    canView: ["error_summary"],
  },
];

export const checkKiroPermission = (
  userRole: string,
  resource: string,
): boolean => {
  const role = kiroRoles.find((r) => r.name === userRole);
  return role?.canView.includes(resource) ?? false;
};


