import 'dotenv/config';
import app from './backend/app';
import express from 'express';
import path from 'node:path';

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => res.sendFile(path.resolve('dist/index.html')));
  }
  app.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log(`Tracker : http://localhost:${process.env.PORT || 3000}`));
}
startServer().catch(console.error);
