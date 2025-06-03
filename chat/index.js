require('dotenv').config();

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('ioredis');
const jwt = require('jsonwebtoken');

const registerSocketEvents = require('./socket');
const customError = require("./customError")

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  path: "/socket.io",
  cors: {
    origin: 'https://footballsquare.co.kr',
    credentials: true,
    // origin: '*', // 개발 중 전체 허용
    // credentials: false 
  }
});

// Redis 클라이언트 2개 (Pub용 / Sub용)
const pubClient = createClient({ 
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
});
const subClient = pubClient.duplicate();

// Redis 어댑터 설정
io.adapter(createAdapter(pubClient, subClient));

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) return next(customError(401, '토큰 없음'));

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    socket.data.user = decoded;
    next();
  } catch (e) {
    console.error("JWT verify 에러:", e.message);
    return next(customError(403, '토큰 유효하지 않습니다'));
  }
});


registerSocketEvents(io);

const PORT = process.env.PORT

httpServer.listen(PORT, () => {
  console.log(`${PORT}번 포트에서 채팅 서버 실행 중`);
});
