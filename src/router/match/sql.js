// 팀 매치 목록 보기
const getTeamMatchListSQL = 
`
SELECT 
    match.match.match_match_idx,
    match.match.player_list_idx,
    player.list.player_list_nickname,
    player.list.player_list_profile_image,
    match.match.match_match_participation_type,
    match.match.match_type_idx,
    match.match.match_match_attribute,
    match.match.common_status_idx,
    match.match.match_match_start_time,
    match.match.match_match_duration
FROM match.match
JOIN player.list ON match.match.player_list_idx = player.list.player_list_idx
WHERE match.match.team_list_idx = $1
ORDER BY match.match.match_match_start_time DESC
LIMIT 10 OFFSET $2;
`

// 공개 매치 목록 보기
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
    10
OFFSET 
    $1;
`

// 공방 매치 생성하기
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
) VALUES ($1, NULL, $2, $3, $4, 0, $5, $6);
`

// 팀 매치 수정하기
const putTeamMatchSQL = 
`
UPDATE match.match
SET 
    match_match_participation_type = $4,
    match_match_attribute = $5,
    match_match_start_time = $6,
    match_match_duration = $7
WHERE match_match_idx = $1
AND team_list_idx = $2
AND player_list_idx = $3;
`

// 매치 마감하기
const closedMatchSQL = 
`
UPDATE 
    match.match
SET 
    common_status_idx = 1
WHERE 
    match_match_idx = $1
AND 
    player_list_idx = $2;
`

// 매치 대기자 목록 삭제하기
const deleteWaitlistSQL =
`
DELETE FROM match.waitlist
WHERE match_match_idx = $1;
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
) VALUES ($1, $2, $3, $4, $5,  $6, $7, $8);
`

// 매치 삭제하기
const deleteMatchSQL = 
`
DELETE FROM 
    match.match 
WHERE match_match_idx = $1;
`

// 매치 세부 정보 가져오기
const getMatchDetailDataSQL =
`
SELECT 
    match.match.match_match_idx,
    match.match.player_list_idx,
    player.list.player_list_nickname,
    player.list.player_list_profile_image,
    match.match.match_formation_idx,
    match.formation.match_position_idxs,
    match.match.match_match_participation_type,
    match.match.match_type_idx,
    match.match.match_match_attribute,
    match.match.common_status_idx,
    match.match.match_match_start_time,
    match.match.match_match_duration
FROM match.match
JOIN player.list ON match.match.player_list_idx = player.list.player_list_idx
JOIN match.formation ON match.match.match_formation_idx = match.formation.match_formation_idx
WHERE match.match.match_match_idx = $1;
`

// 매치 참여자 목록 가져오기
const getMatchParticipantListSQL =
`
SELECT 
    match.participant.player_list_idx,
    player.list.player_list_nickname,
    player.list.player_list_profile_image,
    match.participant.match_position_idx
FROM match.participant
JOIN player.list ON match.participant.player_list_idx = player.list.player_list_idx
WHERE match.participant.match_match_idx = $1
ORDER BY match.participant.match_position_idx ASC;
`

// 매치의 참여 속성을 가져오는 SQL
const checkMatchParticipationSQL =
`
SELECT 
    match.match.match_match_participation_type,
    match.match.player_list_idx
FROM match.match
WHERE match.match.match_match_idx = $1;
`

// 매치에 참여하는 SQL
const postMatchParticipantSQL =
`
WITH player_data AS (
    SELECT player_list_nickname 
    FROM player.list 
    WHERE player_list_idx = $2
),
match_time AS (
    SELECT 
        match.match.match_match_start_time, 
        match.match.match_match_start_time + match.match.match_match_duration AS match_end_time
    FROM match.match 
    WHERE match.match.match_match_idx = $1
)
INSERT INTO match.participant (
    match_match_idx,
    player_list_idx,
    match_position_idx,
    player_list_nickname,
    match_time_range
) VALUES ($1, $2, $3, 
    (SELECT player_list_nickname FROM player_data),
    tstzrange(
        (SELECT match_match_start_time FROM match_time), 
        (SELECT match_end_time FROM match_time), 
        '[)'
    )
);
`

// 매치 참여 대기자 목록 가져오기 
const getMatchWaitListSQL =
`
SELECT 
    match.waitlist.match_position_idx,
    player.list.player_list_idx,
    player.list.player_list_nickname,
    player.list.player_list_profile_image AS player_list_url
FROM match.waitlist
JOIN player.list ON match.waitlist.player_list_idx = player.list.player_list_idx
WHERE match.waitlist.match_match_idx = $1
ORDER BY match.waitlist.match_position_idx, player.list.player_list_idx;
`

// 특정 선수 대기자 목록에서 삭제
const deleteFromWaitListSQL =
`
DELETE FROM 
    match.waitlist
WHERE 
    match_match_idx = $1
AND 
    player_list_idx = $2
AND 
    match_position_idx = $3
RETURNING player_list_idx;
`

// 대기자 목록에서 참여자로 변환하는 SQL
const insertIntoParticipantSQL = `
INSERT INTO match.participant (
    match_match_idx,
    player_list_idx,
    match_position_idx,
    player_list_nickname,
    match_time_range
)
SELECT 
    $1, 
    $2, 
    $3, 
    player.list.player_list_nickname,
    tstzrange(
        match.match.match_match_start_time, 
        match.match.match_match_start_time + match.match.match_match_duration,
        '[)'
    )
FROM player.list
JOIN match.match ON match.match.match_match_idx = $1
WHERE player.list.player_list_idx = $2
RETURNING match_match_idx, player_list_idx, match_position_idx;
`;

// 매치에 참여 대기 등록하는 SQL
const postMatchWaitListSQL =
`
INSERT INTO match.waitlist (
    match_match_idx,
    player_list_idx,
    match_position_idx
) VALUES ($1, $2, $3);
`


module.exports = {
    getTeamMatchListSQL,
    getOpenMatchDataSQL,
    postOpenMatchSQL,
    putTeamMatchSQL,
    closedMatchSQL,
    deleteWaitlistSQL,
    postTeamMatchSQL,
    deleteMatchSQL,
    getMatchDetailDataSQL,
    getMatchParticipantListSQL,
    checkMatchParticipationSQL,
    postMatchParticipantSQL,
    getMatchWaitListSQL,
    deleteFromWaitListSQL,
    insertIntoParticipantSQL,
    postMatchWaitListSQL
}