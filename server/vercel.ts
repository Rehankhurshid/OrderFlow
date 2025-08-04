import { createApp } from './app.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let app: any;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!app) {
    app = await createApp();
  }
  
  return app(req, res);
}