const teamChatHandler = require("./handlers/teamChatHandler")

function registerSocketEvents(io) {
  io.on('connection', (socket) => {
    console.log(`✅ Connected: ${socket.id}`);
    teamChatHandler(io, socket);

    socket.on('disconnect', () => {
      console.log(`❌ Disconnected: ${socket.id}`);
    });

    socket.onAny((event, ...args) => {
      console.log(`[📡 EVENT] ${event}`, args);
    });
  });
}

module.exports = registerSocketEvents;