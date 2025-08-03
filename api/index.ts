export default async function handler(req: any, res: any) {
  // Import the Express app
  const { app } = await import('../server/index.js');
  
  // Let Express handle the request
  app(req, res);
}
