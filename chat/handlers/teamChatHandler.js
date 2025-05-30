const customError = require("../customError")
const client = require("../database/postgreSQL")

function teamChatHandler(io, socket) {
  socket.on('join', () => {
    const my_player_list_idx = socket.data.user?.my_player_list_idx;
    const my_team_list_idx = socket.data.user?.my_team_list_idx;

    console.log(my_team_list_idx)

    if (!my_team_list_idx) {
        socket.emit('join_error', { status: 403, message: "소속 팀이 없습니다." });
        return socket.disconnect(true); // 연결 종료
    }
    if (!my_player_list_idx) {
        socket.emit('join_error', { status: 403, message: "존재하지 않는 플레이어입니다." });
        return socket.disconnect(true); // 연결 종료
    }
    
    const roomId = `team_${my_team_list_idx}`;
    socket.join(roomId);
    socket.data.joined = true;

    console.log(`🚪 ${my_player_list_idx} joined team room: ${roomId}`);
  });

  socket.on('message', async ({ message }) => {
    if (!socket.data.joined) {
      return socket.emit('notJoin_error', { status: 400, message: "채팅방에 참여하지 않았습니다." });
    }
    const player_idx = socket.data.user?.my_player_list_idx;
    const team_idx = socket.data.user?.my_team_list_idx;
    const roomId = `team_${team_idx}`;

    console.log(`💬 ${player_idx} → [${roomId}]: ${message}`);

    let sender;
    // DB 저장
    try {
      const result = await client.query(`
        WITH inserted AS (
            INSERT INTO chat.team_chat_message (
            team_list_idx, player_list_idx, team_chat_message_content
            )
            VALUES ($1, $2, $3)
            RETURNING player_list_idx
        )
        SELECT 
            p.player_list_idx AS sender_idx,
            p.player_list_nickname AS sender_nickname,
            p.player_list_profile_image AS sender_profile_image
        FROM inserted i
        JOIN player.list p ON i.player_list_idx = p.player_list_idx
        `, [team_idx, player_idx, message]);

        sender = result.rows[0];
    } catch (err) {
      console.error('❌ DB 저장 실패:', err);
      return socket.emit('message_error', { status: 500, message: "DB 연결 실패" });
    }

    // 본인 포함 전체 방 유저에게 메시지 전송
    const payload = {
        sender_idx: sender.sender_idx,
        sender_nickname: sender.sender_nickname,
        sender_profile_image: sender.sender_profile_image,
        message
    };

    socket.emit('message', payload);            // 본인에게
    socket.to(roomId).emit('message', payload); // 나머지 유저들에게
  });
}

module.exports = teamChatHandler;
