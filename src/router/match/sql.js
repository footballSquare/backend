const getOpenMatchDataSQL =
`
SELECT 
    m.match_match_idx,
    m.team_list_idx,
    t.team_list_name,
    t.team_list_emblem,
    m.player_list_idx,
    p.player_list_nickname,
    p.player_list_profile_image,
    m.match_formation_idx,
    m.match_match_participation_type,
    m.match_type_idx,
    m.common_status_idx,
    m.match_match_start_time,
    m.match_match_duration
FROM match.match AS m
JOIN player.list AS p ON m.player_list_idx = p.player_list_idx
LEFT JOIN team.list AS t ON m.team_list_idx = t.team_list_idx
WHERE m.match_match_attribute = 0;
`

module.exports = {
    getOpenMatchDataSQL
}