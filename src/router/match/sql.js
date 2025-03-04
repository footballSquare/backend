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
FROM 
    match.match AS m
JOIN 
    player.list AS p ON m.player_list_idx = p.player_list_idx
LEFT JOIN 
    team.list AS t ON m.team_list_idx = t.team_list_idx
WHERE 
    m.match_match_attribute = 0
ORDER BY 
    m.match_match_start_time DESC
LIMIT 
    $1 
OFFSET 
    $2;
`

const postOpenMatchSQL =
`
INSERT INTO match.match (
    player_list_idx,
    team_list_idx,
    match_formation_idx,
    match_match_participation_type,
    match_type_idx,
    match_match_attribute,
    match_match_start_time,
    match_match_duration
) VALUES ($1, NULL, $2, $3, $4, $5,  $6, $7);
`

const postTeamMatchSQL = 
`
INSERT INTO match.match (
    team_list_idx,
    player_list_idx,
    match_formation_idx,
    match_match_participation_type,
    match_type_idx,
    match_match_attribute,
    match_match_start_time,
    match_match_duration
) VALUES ($1, $2, $3, $4, $5,  $6, $7,$8);
`

const deleteMatchSQL = 
`
DELETE FROM 
    match.match 
WHERE match_match_idx = $1;

`

module.exports = {
    getOpenMatchDataSQL,
    postOpenMatchSQL,
    postTeamMatchSQL,
    deleteMatchSQL
}