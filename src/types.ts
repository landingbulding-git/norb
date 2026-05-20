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

export interface Article {
  id: string;
  title: string;
  status: 'pinned' | 'ongoing' | 'ended' | 'in hold';
  cover: string | null;
  created: string;
}

export interface UserMessage {
  id: string;
  message: string;
  firstName?: string;
  email?: string;
  createdAt: string;
}
