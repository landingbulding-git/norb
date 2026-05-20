import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': '.',
      },
    },
    build: {
      // Inline CSS below 15kb to prevent render-blocking requests
      assetsInlineLimit: 15360,
    }
  },
  image: {
    domains: ['ke0c0udeqzgh4whn.public.blob.vercel-storage.com', 'prod-files-secure.s3.us-west-2.amazonaws.com'],
  }
});
