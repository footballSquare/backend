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

module.exports = {
    getMatchTypeSQL,
    findTeamCaptainSQL,
    postTeamMatchSQL,
    postChampionShipMatchSQL
}