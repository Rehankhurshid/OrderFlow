export default async function handler(req: any, res: any) {
  // Import the Express app creator
  const { createApp } = await import('../server/app.js');
  
  // Create and get the Express app
  const app = await createApp();
  
  // Let Express handle the request
  app(req, res);
}
