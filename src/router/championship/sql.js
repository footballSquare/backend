// 매치 타입 가져오기 SQL
const getMatchTypeSQL =
`
SELECT 
    match_type_idx 
FROM 
    championship.list 
WHERE 
    championship_list_idx = $1
`

// 팀 주장 찾기 SQL
const findTeamCaptainSQL = 
`
SELECT 
    player_list_idx 
FROM team.member 
WHERE team_list_idx = $1 AND team_role_idx = $2
`

// 팀 매치 생성하기
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
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING match_match_idx;
`

// 대회 매치 추가하기
const postChampionShipMatchSQL = 
`
INSERT INTO championship.championship_match (
    championship_list_idx, 
    championship_match_first_idx, 
    championship_match_second_idx,
    match_match_start_time, 
    match_match_duration
) VALUES ($1, $2, $3, $4, $5)
`

// 대회 정보 가져오기
const getChampionShipDataSQL =
`
SELECT 
    c.championship_list_idx,
    c.championship_list_name,
    c.championship_list_description,
    c.match_type_idx,
    c.championship_list_throphy_img,
    c.championship_list_start_date,
    c.championship_list_end_date,
    c.championship_list_color,
    c.common_status_idx,
    w.team_list_idx AS winner_team_idx,
    w.championship_winner_team_name AS winner_team_name,
    t.team_list_emblem AS winner_team_emblem,
    t.team_list_color AS winner_team_color
FROM championship.list AS c
LEFT JOIN championship.winner AS w 
    ON c.championship_list_idx = w.championship_list_idx
LEFT JOIN team.list AS t
    ON w.team_list_idx = t.team_list_idx
WHERE c.championship_list_idx = $1;
`

// 대회 참여 팀 가져오기
const getChampionShipParticipationTeamSQL =
`
SELECT 
    championship.participation_team.team_list_idx,
    championship.participation_team.team_list_name,
    team.list.team_list_short_name,
    team.list.team_list_color,
    team.list.team_list_emblem
FROM championship.participation_team
JOIN team.list ON championship.participation_team.team_list_idx = team.list.team_list_idx
WHERE championship.participation_team.championship_list_idx = $1;
`

module.exports = {
    getMatchTypeSQL,
    findTeamCaptainSQL,
    postTeamMatchSQL,
    postChampionShipMatchSQL,
    getChampionShipDataSQL,
    getChampionShipParticipationTeamSQL
}