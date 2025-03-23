export default async function handler(req, res) {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'Missing URL parameter' });
    }
    
    try {
      const imageResponse = await fetch(url);
      if (!imageResponse.ok) {
        return res.status(imageResponse.status).json({ error: 'Failed to fetch image' });
      }
      
      const imageBuffer = await imageResponse.arrayBuffer();
      
      // Set appropriate content type based on image
      res.setHeader('Content-Type', imageResponse.headers.get('content-type'));
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
      
      // Send the image data
      res.status(200).send(Buffer.from(imageBuffer));
    } catch (error) {
      console.error('Error proxying image:', error);
      res.status(500).json({ error: 'Failed to proxy image' });
    }
  }