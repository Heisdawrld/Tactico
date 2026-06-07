// API Routes for Tactico Backend

export default function handler(req, res) {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Tactico API is running',
    version: '1.0.0'
  });
}
