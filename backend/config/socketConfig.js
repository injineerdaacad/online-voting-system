import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { buildOriginMatcher } from '../utils/corsOriginMatcher.js';

let io;

export const initSocket = (server) => {
  const { isAllowedOrigin } = buildOriginMatcher(process.env.ALLOWED_ORIGINS || '');

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          return callback(null, true);
        }

        return callback(
          new Error(
            `CORS policy: Origin ${origin} is not allowed by Access-Control-Allow-Origin policy.`
          ),
          false
        );
      },
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    socket.on('join_user_room', async (data) => {
      try {
        if (!data.token) {
          socket.emit('auth_error', { message: 'No token provided' });
          return;
        }

        const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
        const userId = decoded.id;
        socket.join(`user_${userId}`);
        socket.emit('auth_success', { userId });
      } catch (error) {
        socket.emit('auth_error', { message: 'Invalid token' });
      }
    });

    socket.on('join-election', (electionId) => {
      socket.join(`election-${electionId}`);
    });

    socket.on('leave-election', (electionId) => {
      socket.leave(`election-${electionId}`);
    });

    socket.on('join-faculty', (facultyId) => {
      socket.join(`faculty-${facultyId}`);
    });
  });

  return io;
};

export { io };
