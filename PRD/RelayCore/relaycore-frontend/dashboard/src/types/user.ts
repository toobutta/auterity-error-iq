export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'User';
  status: 'Active' | 'Pending' | 'Inactive';
  lastActive: string;
  createdAt: string;
  permissions?: string[];
  avatar?: string;
  teams?: string[];
  apiKeys?: {
    id: string;
    name: string;
    lastUsed: string;
    createdAt: string;
  }[];
}