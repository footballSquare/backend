const getTeamChatSQL = 
`
SELECT 
    tcm.team_chat_message_idx,
    tcm.team_list_idx,
    tcm.player_list_idx,
    tcm.team_chat_message_content,
    tcm.team_chat_message_created_at,
    tcm.team_chat_message_deleted_at,
    p.player_list_nickname,
    p.player_list_profile_image
FROM chat.team_chat_message tcm
LEFT JOIN player.list p ON tcm.player_list_idx = p.player_list_idx
WHERE tcm.team_list_idx = $1
    AND tcm.team_chat_message_deleted_at IS NULL
ORDER BY tcm.team_chat_message_created_at DESC
LIMIT 30 OFFSET $2 * 30;
`

module.exports = {
    getTeamChatSQL
}