const { 
    COMMON_STATUS
} = require("../../constant/constantIndex")

// 팀 매치 목록 보기
const getTeamMatchListSQL = 
`
SELECT 
    m.match_match_idx,
    m.match_match_name,
    m.match_type_idx,
    t.team_list_idx,
    t.team_list_name,
    t.team_list_emblem,
    m.match_match_attribute,
    m.match_match_participation_type,
    p.player_list_idx,
    p.player_list_nickname,
    p.player_list_profile_image,
    m.match_match_start_time,
    m.match_match_duration,
    m.common_status_idx,
    m.match_formation_idx
FROM match.match AS m
JOIN player.list AS p ON m.player_list_idx = p.player_list_idx
JOIN team.list AS t ON m.team_list_idx = t.team_list_idx
WHERE m.team_list_idx = $1
ORDER BY m.match_match_start_time DESC
LIMIT 10 OFFSET $2 * 10;

`

// 공개 매치 목록 보기
const getOpenMatchDataSQL =
`
SELECT
    m.match_match_idx,
    m.match_match_name,
    m.match_type_idx,
    m.team_list_idx,
    t.team_list_name,
    t.team_list_emblem,
    m.match_match_attribute,
    m.match_match_participation_type,
    m.player_list_idx,
    p.player_list_nickname,
    p.player_list_profile_image,
    m.match_match_start_time,
    m.match_match_duration,
    m.match_formation_idx,
    m.common_status_idx
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
    $1 * 10;
`

// 공방 매치 생성하기
const postOpenMatchSQL =
`
WITH inserted_match AS (
  INSERT INTO match.match (
    player_list_idx,
    team_list_idx,
    match_formation_idx,
    match_match_participation_type,
    match_type_idx,
    match_match_attribute,
    match_match_start_time,
    match_match_duration
  )
  VALUES ($1, NULL, $2, $3, $4, 0, $5, $6)
  RETURNING *
)
SELECT 
  im.match_match_idx,
  im.match_match_name,
  im.team_list_idx,
  im.player_list_idx,
  im.match_formation_idx,
  im.match_match_participation_type,
  im.match_type_idx,
  im.match_match_attribute,
  im.match_match_start_time,
  im.match_match_duration,

  -- 팀 정보
  tl.team_list_name,
  tl.team_list_emblem,

  -- 선수 정보
  pl.player_list_nickname

FROM inserted_match im
LEFT JOIN team.list tl ON im.team_list_idx = tl.team_list_idx
LEFT JOIN player.list pl ON im.player_list_idx = pl.player_list_idx;
`

// 팀 매치 수정하기
const putTeamMatchSQL = 
`
UPDATE match.match
SET 
    match_match_participation_type = $4,
    match_match_attribute = $5,
    match_match_start_time = $6,
    match_match_duration = $7,
    match_formation_idx = $8
WHERE match_match_idx = $1
AND team_list_idx = $2
AND player_list_idx = $3;
`

// 팀 매치 공개/비공개 매치로 변경전
const changeMatchAttributeSQL = 
`
UPDATE match.match
SET 
    match_match_attribute = $2
WHERE match_match_idx = $1
AND team_list_idx = $3;
`

// 팀 매치 수정하기
const putTeamMatchAtChampionShipSQL = 
`
UPDATE match.match
SET 
    match_formation_idx = $4
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
WITH inserted_match AS (
  INSERT INTO match.match (
    team_list_idx,
    player_list_idx,
    match_formation_idx,
    match_match_participation_type,
    match_type_idx,
    match_match_attribute,
    match_match_start_time,
    match_match_duration
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  RETURNING *
)
SELECT 
  im.match_match_idx,
  im.match_match_name,
  im.team_list_idx,
  im.player_list_idx,
  im.match_formation_idx,
  im.match_match_participation_type,
  im.match_type_idx,
  im.match_match_attribute,
  im.match_match_start_time,
  im.match_match_duration,

  -- 팀 정보
  tl.team_list_name,
  tl.team_list_emblem,

  -- 선수 정보
  pl.player_list_nickname

FROM inserted_match im
LEFT JOIN team.list tl ON im.team_list_idx = tl.team_list_idx
LEFT JOIN player.list pl ON im.player_list_idx = pl.player_list_idx;
`

// 매치 삭제하기
const deleteMatchSQL = 
`
DELETE FROM 
    match.match 
WHERE match_match_idx = $1;
`

// 매치 참여자 삭제
const deleteParticipantSQL = 
`
DELETE FROM match.participant
WHERE match_match_idx = $1 AND player_list_idx = $2;
`;

// 매치 대기자 목록 가져오기 
const getMatchStanbyListSQL = 
`
SELECT 
    p.player_list_idx,
    p.player_list_nickname,
    p.player_list_profile_image,
    p.match_position_idx,
    tm.team_list_idx,
    t.team_list_short_name,
    t.team_list_emblem
FROM 
    player.list p
LEFT JOIN 
    team.member tm ON p.player_list_idx = tm.player_list_idx
LEFT JOIN 
    team.list t ON tm.team_list_idx = t.team_list_idx
WHERE 
    p.player_list_state = ${COMMON_STATUS.OPEN_MATCH_PARTICIPATION};
`

// 매치 세부 정보 가져오기
const getMatchDetailDataSQL =
`
SELECT 
    match.match.match_match_idx,
    match.match.match_match_name,
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
    player.list.player_list_profile_image AS player_list_url,
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
    match.waitlist.match_waitlist_created_at,
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

// 팀 스탯 입력
const postTeamStatsSQL =
`
WITH team_data AS (
    SELECT team_list_name FROM team.list WHERE team_list_idx = $2
)
INSERT INTO match.team_stats (
    match_match_idx,
    team_list_idx,
    team_list_name,
    match_team_stats_our_score,
    match_team_stats_other_score,
    match_team_stats_possession,
    match_team_stats_total_shot,
    match_team_stats_expected_goal,
    match_team_stats_total_pass,
    match_team_stats_total_tackle,
    match_team_stats_success_tackle,
    match_team_stats_saved,
    match_team_stats_cornerkick,
    match_team_stats_freekick,
    match_team_stats_penaltykick,
    match_team_stats_evidence_img
) VALUES (
    $1, 
    $2, 
    (SELECT team_list_name FROM team_data), 
    $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
)
RETURNING match_team_stats_idx;
`;

// mom 선정 SQL
const postMomSQL =
`
INSERT INTO match.mom (
    match_team_stats_idx,
    match_match_idx,
    player_list_idx,
    player_list_nickname
)
SELECT 
    $2,
    $1,
    $3,
(SELECT player_list_nickname FROM player.list WHERE player_list_idx = $3);
`

// 팀 스탯 수정 SQL
const putTeamStatsSQL = 
`
UPDATE match.team_stats
SET 
    match_team_stats_our_score = $3,
    match_team_stats_other_score = $4,
    match_team_stats_possession = $5,
    match_team_stats_total_shot = $6,
    match_team_stats_expected_goal = $7,
    match_team_stats_total_pass = $8,
    match_team_stats_total_tackle = $9,
    match_team_stats_success_tackle = $10,
    match_team_stats_saved = $11,
    match_team_stats_cornerkick = $12,
    match_team_stats_freekick = $13,
    match_team_stats_penaltykick = $14
WHERE match_match_idx = $1
AND team_list_idx = $2
RETURNING match_team_stats_idx; 
`

// MOM 수정 
const putMomSQL =
`
UPDATE match.mom
SET 
    match_team_stats_idx = $2,
    player_list_idx = (SELECT player_list_idx FROM player.list WHERE player_list_idx = $3),
    player_list_nickname = (SELECT player_list_nickname FROM player.list WHERE player_list_idx = $3)
WHERE match_match_idx = $1;
`

// 매치 참여자 삭제
const deletedMatchParticipantSQL = 
`
DELETE FROM match.participant
WHERE match_match_idx = $1;
`

// 매치 대기자 목록 삭제 
const deletedMatchWaitListSQL = 
`
DELETE FROM match.waitlist
WHERE match_match_idx = $1;
`

// 개인 스탯 입력하기
const postPlayerStatsSQL =
`
WITH player_data AS (
    SELECT player_list_nickname 
    FROM player.list 
    WHERE player_list_idx = $2
)
INSERT INTO match.player_stats (
    match_match_idx,
    player_list_idx,
    player_list_nickname,
    match_player_stats_goal,
    match_player_stats_assist,
    match_player_stats_successrate_pass,
    match_player_stats_successrate_dribble,
    match_player_stats_successrate_tackle,
    match_player_stats_possession,
    match_player_stats_standing_tackle,
    match_player_stats_sliding_tackle,
    match_player_stats_cutting,
    match_player_stats_saved,
    match_player_stats_successrate_saved,
    match_player_stats_evidence_img
) VALUES (
    $1, $2, (SELECT player_list_nickname FROM player_data), 
    $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
)
`

// 개인 스탯 수정하기
const putPlayerStatsSQL = 
`
UPDATE match.player_stats
SET 
    match_player_stats_goal = $3,
    match_player_stats_assist = $4,
    match_player_stats_successrate_pass = $5,
    match_player_stats_successrate_dribble = $6,
    match_player_stats_successrate_tackle = $7,
    match_player_stats_possession = $8,
    match_player_stats_standing_tackle = $9,
    match_player_stats_sliding_tackle = $10,
    match_player_stats_cutting = $11,
    match_player_stats_saved = $12,
    match_player_stats_successrate_saved = $13
WHERE match_match_idx = $1 
AND player_list_idx = $2;
`

module.exports = {
    getTeamMatchListSQL,
    getOpenMatchDataSQL,
    postOpenMatchSQL,
    putTeamMatchSQL,
    putTeamMatchAtChampionShipSQL,
    changeMatchAttributeSQL,
    closedMatchSQL,
    deleteWaitlistSQL,
    postTeamMatchSQL,
    deleteMatchSQL,
    getMatchStanbyListSQL,
    getMatchDetailDataSQL,
    getMatchParticipantListSQL,
    checkMatchParticipationSQL,
    postMatchParticipantSQL,
    getMatchWaitListSQL,
    deleteFromWaitListSQL,
    insertIntoParticipantSQL,
    postMatchWaitListSQL,
    postTeamStatsSQL,
    postMomSQL,
    putTeamStatsSQL,
    putMomSQL,
    deleteParticipantSQL,
    deletedMatchParticipantSQL,
    deletedMatchWaitListSQL,
    postPlayerStatsSQL,
    putPlayerStatsSQL
}