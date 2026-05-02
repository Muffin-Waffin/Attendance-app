const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Enable CORS for all origins so the Vite app can connect
app.use(cors({
  origin: '*'
}));

// Parse JSON bodies
app.use(express.json());
// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// The webhook endpoint for Google Forms
app.post('/api/webhook', (req, res) => {
  console.log('Webhook received:', req.body);
  
  // Broadcast to all connected clients
  io.emit('new_response', req.body);

  // Acknowledge receipt
  res.status(200).json({ success: true, message: 'Data broadcasted to clients.' });
});

// A simple GET endpoint to verify the server is running
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'WebSocket server is running.' });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
