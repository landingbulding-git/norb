export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'Simmering' | 'Boiling' | 'Baked';
  statusLabel: string;
  badge?: string;
  tech: string[];
  link?: string;
}

export interface UserMessage {
  id: string;
  message: string;
  firstName?: string;
  email?: string;
  createdAt: string;
}
