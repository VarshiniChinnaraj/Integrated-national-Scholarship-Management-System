const { Server } = require('socket.io');

let ioInstance = null;

const initSocketIO = (httpServer) => {
  if (ioInstance) return ioInstance;

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  io.on('connection', (socket) => {
    // console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join room based on user role or entity
    socket.on('join_room', (roomName) => {
      if (roomName) {
        socket.join(roomName);
        // console.log(`[Socket.IO] Client ${socket.id} joined room ${roomName}`);
      }
    });

    socket.on('subscribe_application', (applicationNumber) => {
      if (applicationNumber) {
        socket.join(`app:${applicationNumber}`);
      }
    });

    socket.on('disconnect', () => {
      // console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  ioInstance = io;
  return io;
};

const getIO = () => {
  return ioInstance;
};

const broadcastSlpEvent = (eventName, data) => {
  if (!ioInstance) return;
  try {
    ioInstance.emit(eventName, data);
    // Also emit to application-specific room if available
    if (data?.applicationNumber) {
      ioInstance.to(`app:${data.applicationNumber}`).emit(eventName, data);
    }
  } catch (err) {
    console.error(`[Socket.IO] Error emitting ${eventName}:`, err.message);
  }
};

module.exports = {
  initSocketIO,
  getIO,
  broadcastSlpEvent
};
