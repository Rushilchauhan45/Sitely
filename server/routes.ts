
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { sendExpoPushNotification } from './notifications';

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  app.post('/api/notify', async (req: Request, res: Response) => {
    const { token, title, body, data } = req.body;
    if (!token || !title || !body) {
      return res.status(400).json({ error: 'token, title, and body are required' });
    }
    try {
      const result = await sendExpoPushNotification(token, title, body, data);
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to send notification' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
