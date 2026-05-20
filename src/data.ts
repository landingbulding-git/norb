import { Project } from './types.ts';

export const projects: Project[] = [
  {
    id: 'ophelia',
    title: 'Ophelia',
    description: 'A soothing orange orb Chrome extension that transforms your browser into an interactive, real-time classroom. Ophelia leads you by the hand, learns from your corrections, and provides expert mentorship.',
    status: 'Boiling',
    statusLabel: 'Active dev',
    badge: 'Popular',
    tech: ['Chrome Extension', 'React', 'Gemini AI', 'Tailwind'],
    link: '#',
  },
  {
    id: 'kettle',
    title: 'Kettle',
    description: 'Minimalist, cookie-free micro-analytics for indie hackers. Blazing fast, lightweight, and renders beautifully crisp D3 charts representing real-time traffic spikes.',
    status: 'Baked',
    statusLabel: 'Production',
    badge: 'v1.1',
    tech: ['React', 'D3.js', 'Vite', 'TypeScript'],
    link: '#',
  },
  {
    id: 'platter',
    title: 'Platter',
    description: 'An ultra-fast developer command line interface to bundle, build, and deploy serverless containers around the world in a single millisecond command.',
    status: 'Simmering',
    statusLabel: 'Planning',
    badge: 'Alpha',
    tech: ['Go', 'Docker', 'eBPF', 'Wasm'],
    link: '#',
  },
];

export const socialLinks = {
  github: 'https://github.com',
  twitter: 'https://twitter.com',
  linkedin: 'https://linkedin.com',
  email: 'mailto:norbertb.consulting@gmail.com',
};
