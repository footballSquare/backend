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

// 대회 매치 인덱스 가져오기
const getChampionshipMatchIdx =
`
SELECT championship_match_first_idx, championship_match_second_idx
FROM championship.championship_match
WHERE championship_match_idx = $1
`

// 각 매치 삭제하기
const deleteEachMatchSQL =
`
DELETE FROM match.match WHERE match_match_idx IN ($1, $2)
`

// 대회 매치 삭제하기
const deleteChampionshipMatchSQL =
`
DELETE FROM championship.championship_match
WHERE championship_match_idx = $1;
`

// 대회 매치 마감하기
const matchDoneSQL =
`
UPDATE match.match
SET common_status_idx = $3
WHERE match_match_idx IN ($1, $2);
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

// 대회 매치 증빙 자료 조회
const fetchEvidanceImgSQL=
`
WITH match_info AS (
    -- 대회 매치 인덱스로 팀 매치 인덱스 가져오기
    SELECT 
        cm.championship_match_idx,
        cm.championship_match_first_idx AS first_match_idx,
        cm.championship_match_second_idx AS second_match_idx
    FROM championship.championship_match cm
    WHERE cm.championship_match_idx = $1
),
team_stats AS (
    -- 각 매치의 팀 스탯 증빙 자료 가져오기
    SELECT 
        ts.match_match_idx,
        ts.team_list_idx,
        ts.match_team_stats_evidence_img
    FROM match.team_stats ts
    WHERE ts.match_match_idx IN (SELECT first_match_idx FROM match_info UNION SELECT second_match_idx FROM match_info)
),
player_stats AS (
    -- 각 매치의 참여자들의 개인 증빙 자료 가져오기
    SELECT 
        ps.match_match_idx,
        ps.player_list_idx,
        ps.player_list_nickname,
        ps.match_player_stats_evidence_img
    FROM match.player_stats ps
    WHERE ps.match_match_idx IN (SELECT first_match_idx FROM match_info UNION SELECT second_match_idx FROM match_info)
)
SELECT 
    mi.championship_match_idx,
    mi.first_match_idx,
    mi.second_match_idx,

    -- 첫 번째 팀 증빙 자료
    json_agg(DISTINCT ts1) FILTER (WHERE ts1.match_match_idx IS NOT NULL) AS first_team_evidence,
    
    -- 두 번째 팀 증빙 자료
    json_agg(DISTINCT ts2) FILTER (WHERE ts2.match_match_idx IS NOT NULL) AS second_team_evidence,

    -- 참여 선수들의 증빙 자료 (JSON 배열)
    json_agg(DISTINCT ps) FILTER (WHERE ps.match_match_idx IS NOT NULL) AS player_evidence
FROM match_info mi
LEFT JOIN team_stats ts1 ON mi.first_match_idx = ts1.match_match_idx
LEFT JOIN team_stats ts2 ON mi.second_match_idx = ts2.match_match_idx
LEFT JOIN player_stats ps ON ps.match_match_idx IN (mi.first_match_idx, mi.second_match_idx)
GROUP BY 
    mi.championship_match_idx, 
    mi.first_match_idx, 
    mi.second_match_idx;
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
    c.championship_type_idx,
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

// 대회 매치 정보 가져오기
const fetchChampionshipMatchesSQL = 
`
SELECT 
    cm.championship_match_idx,
    cm.championship_match_first_idx,
    cm.championship_match_second_idx,
    
    mf.team_list_idx AS first_team_idx,
    mf.common_status_idx AS first_common_status_idx,

    ms.team_list_idx AS second_team_idx,
    ms.common_status_idx AS second_common_status_idx

FROM championship.championship_match cm
LEFT JOIN match.match mf ON cm.championship_match_first_idx = mf.match_match_idx
LEFT JOIN match.match ms ON cm.championship_match_second_idx = ms.match_match_idx
WHERE cm.championship_list_idx = $1;
`

// 각 팀 정보 가져오기
const fetchTeamInfoSQL = 
`
SELECT 
    team_list_idx,
    team_list_name,
    team_list_short_name,
    team_list_color,
    team_list_emblem
FROM team.list
WHERE team_list_idx = ANY($1);
`;

// 매치 스텟 가져오기
const fetchMatchStatsSQL = `
SELECT 
    match_match_idx,
    team_list_idx,
    match_team_stats_our_score,
    match_team_stats_other_score
FROM match.team_stats
WHERE match_match_idx = ANY($1);
`;

// 매치 세부 정보 가져오기
const fetchChampionShipMatchSQL =
`
WITH match_info AS (
    SELECT 
        cm.championship_match_idx,
        cm.championship_list_idx,
        cm.match_match_start_time,
        cm.match_match_duration,
        cm.championship_match_first_idx,
        cm.championship_match_second_idx,
        m1.match_formation_idx AS first_match_formation_idx,
        m2.match_formation_idx AS second_match_formation_idx
    FROM championship.championship_match cm
    JOIN match.match m1 ON cm.championship_match_first_idx = m1.match_match_idx
    JOIN match.match m2 ON cm.championship_match_second_idx = m2.match_match_idx
    WHERE cm.championship_match_idx = $1
),
team_stats AS (
    SELECT 
        ts.match_team_stats_idx,
        ts.match_match_idx,
        ts.team_list_idx,
        ts.match_team_stats_our_score,
        ts.match_team_stats_other_score,
        ts.match_team_stats_possession,
        ts.match_team_stats_total_shot,
        ts.match_team_stats_expected_goal,  
        ts.match_team_stats_total_pass,
        ts.match_team_stats_total_tackle,
        ts.match_team_stats_success_tackle,
        ts.match_team_stats_saved,
        ts.match_team_stats_cornerkick,
        ts.match_team_stats_freekick,
        ts.match_team_stats_penaltykick
    FROM match.team_stats ts
    WHERE ts.match_match_idx IN (
        SELECT championship_match_first_idx FROM match_info 
        UNION 
        SELECT championship_match_second_idx FROM match_info
    )
),
player_info AS (
    SELECT 
        p.match_match_idx,
        p.player_list_idx,
        p.match_position_idx,
        pl.player_list_nickname,
        ps.match_player_stats_goal,
        ps.match_player_stats_assist,
        ps.match_player_stats_successrate_pass,
        ps.match_player_stats_successrate_dribble,
        ps.match_player_stats_successrate_tackle,
        ps.match_player_stats_possession,
        ps.match_player_stats_standing_tackle,
        ps.match_player_stats_sliding_tackle,
        ps.match_player_stats_cutting,
        ps.match_player_stats_saved,
        ps.match_player_stats_successrate_saved
    FROM match.participant p
    JOIN player.list pl ON p.player_list_idx = pl.player_list_idx
    LEFT JOIN match.player_stats ps 
      ON p.match_match_idx = ps.match_match_idx 
     AND p.player_list_idx = ps.player_list_idx
    WHERE p.match_match_idx IN (
        SELECT championship_match_first_idx FROM match_info 
        UNION 
        SELECT championship_match_second_idx FROM match_info
    )
)
SELECT 
    mi.championship_match_idx,
    mi.championship_list_idx,
    mi.match_match_start_time,
    mi.match_match_duration,
    mi.championship_match_first_idx, 
    mi.championship_match_second_idx,
    mi.first_match_formation_idx,
    mi.second_match_formation_idx,

    -- 첫 번째 팀 정보
    ts1.team_list_idx AS first_team_idx,
    ts1.match_team_stats_idx AS first_team_stats_idx,
    ts1.match_team_stats_our_score AS first_team_our_score,
    ts1.match_team_stats_other_score AS first_team_other_score,
    ts1.match_team_stats_possession AS first_team_possession,
    ts1.match_team_stats_total_shot AS first_team_total_shot,
    ts1.match_team_stats_expected_goal AS first_team_expected_goal,
    ts1.match_team_stats_total_pass AS first_team_total_pass,
    ts1.match_team_stats_total_tackle AS first_team_total_tackle,
    ts1.match_team_stats_success_tackle AS first_team_success_tackle,
    ts1.match_team_stats_saved AS first_team_saved,
    ts1.match_team_stats_cornerkick AS first_team_cornerkick,
    ts1.match_team_stats_freekick AS first_team_freekick,
    ts1.match_team_stats_penaltykick AS first_team_penaltykick,
    COALESCE(mom1.player_list_idx, NULL) AS first_team_mom_idx,
    COALESCE(mom1.player_list_nickname, NULL) AS first_team_mom_nickname,

    -- 두 번째 팀 정보
    ts2.team_list_idx AS second_team_idx,
    ts2.match_team_stats_idx AS second_team_stats_idx,
    ts2.match_team_stats_our_score AS second_team_our_score,
    ts2.match_team_stats_other_score AS second_team_other_score,
    ts2.match_team_stats_possession AS second_team_possession,
    ts2.match_team_stats_total_shot AS second_team_total_shot,
    ts2.match_team_stats_expected_goal AS second_team_expected_goal,
    ts2.match_team_stats_total_pass AS second_team_total_pass,
    ts2.match_team_stats_total_tackle AS second_team_total_tackle,
    ts2.match_team_stats_success_tackle AS second_team_success_tackle,
    ts2.match_team_stats_saved AS second_team_saved,
    ts2.match_team_stats_cornerkick AS second_team_cornerkick,
    ts2.match_team_stats_freekick AS second_team_freekick,
    ts2.match_team_stats_penaltykick AS second_team_penaltykick,
    COALESCE(mom2.player_list_idx, NULL) AS second_team_mom_idx,
    COALESCE(mom2.player_list_nickname, NULL) AS second_team_mom_nickname,

    -- 선수 정보 (스탯 유무와 관계 없이)
    COALESCE(json_agg(pi.*) FILTER (WHERE pi.match_match_idx IS NOT NULL), '[]') AS player_stats

FROM match_info mi
LEFT JOIN team_stats ts1 ON mi.championship_match_first_idx = ts1.match_match_idx
LEFT JOIN match.mom mom1 ON ts1.match_team_stats_idx = mom1.match_team_stats_idx
LEFT JOIN team_stats ts2 ON mi.championship_match_second_idx = ts2.match_match_idx
LEFT JOIN match.mom mom2 ON ts2.match_team_stats_idx = mom2.match_team_stats_idx
LEFT JOIN player_info pi ON pi.match_match_idx IN (mi.championship_match_first_idx, mi.championship_match_second_idx)

GROUP BY 
    mi.championship_match_idx, 
    mi.championship_list_idx, 
    mi.match_match_start_time, 
    mi.match_match_duration, 
    mi.championship_match_first_idx,
    mi.championship_match_second_idx,
    mi.first_match_formation_idx,
    mi.second_match_formation_idx,
    ts1.match_team_stats_idx, ts2.match_team_stats_idx,
    ts1.team_list_idx, ts2.team_list_idx, 
    ts1.match_team_stats_our_score, ts1.match_team_stats_other_score,
    ts1.match_team_stats_possession, ts1.match_team_stats_total_shot, ts1.match_team_stats_expected_goal,
    ts1.match_team_stats_total_pass, ts1.match_team_stats_total_tackle, ts1.match_team_stats_success_tackle,
    ts1.match_team_stats_saved, ts1.match_team_stats_cornerkick, ts1.match_team_stats_freekick, ts1.match_team_stats_penaltykick,
    ts2.match_team_stats_our_score, ts2.match_team_stats_other_score,
    ts2.match_team_stats_possession, ts2.match_team_stats_total_shot, ts2.match_team_stats_expected_goal,
    ts2.match_team_stats_total_pass, ts2.match_team_stats_total_tackle, ts2.match_team_stats_success_tackle,
    ts2.match_team_stats_saved, ts2.match_team_stats_cornerkick, ts2.match_team_stats_freekick, ts2.match_team_stats_penaltykick,
    mom1.player_list_idx, mom1.player_list_nickname,
    mom2.player_list_idx, mom2.player_list_nickname;
`

// 대회 개인 스탯 가져오기
const getChampionShipPlayerStatsSQL = 
`
WITH championship_matches AS (
    -- 대회에 속한 대회 매치 조회
    SELECT cm.championship_match_idx, cm.championship_list_idx, 
           cm.championship_match_first_idx, cm.championship_match_second_idx
    FROM championship.championship_match cm
    WHERE cm.championship_list_idx = $1
),
all_matches AS (
    -- 대회 매치에 속한 개별 매치 조회
    SELECT championship_match_idx, championship_list_idx, match_match_idx
    FROM championship_matches,
    LATERAL UNNEST(ARRAY[championship_match_first_idx, championship_match_second_idx]) AS match_match_idx
),
match_participant AS (
    -- 개별 매치에 참여한 선수 조회
    SELECT mp.match_match_idx, mp.player_list_idx
    FROM match.participant mp
    WHERE mp.match_match_idx IN (SELECT match_match_idx FROM all_matches)
),
player_stats AS (
    -- 선수의 개인 스탯 조회 (참가자만 가져옴)
    SELECT ps.*
    FROM match.player_stats ps
    WHERE ps.match_match_idx IN (SELECT match_match_idx FROM all_matches)
)
SELECT 
    cm.championship_match_idx,
    cm.championship_list_idx,
    am.match_match_idx,
    ps.player_list_idx,
    ps.match_player_stats_idx,
    ps.player_list_nickname,
    ps.match_player_stats_goal,
    ps.match_player_stats_assist,
    ps.match_player_stats_successrate_pass,
    ps.match_player_stats_successrate_dribble,
    ps.match_player_stats_successrate_tackle,
    ps.match_player_stats_possession,
    ps.match_player_stats_evidence_img,
    ps.match_player_stats_standing_tackle,
    ps.match_player_stats_sliding_tackle,
    ps.match_player_stats_cutting,
    ps.match_player_stats_saved,
    ps.match_player_stats_successrate_saved
FROM championship_matches cm
JOIN all_matches am ON am.championship_match_idx = cm.championship_match_idx
JOIN player_stats ps ON ps.match_match_idx = am.match_match_idx
ORDER BY cm.championship_match_idx, am.match_match_idx;
`

module.exports = {
    getMatchTypeSQL,
    findTeamCaptainSQL,
    postTeamMatchSQL,
    getChampionshipMatchIdx,
    deleteEachMatchSQL,
    deleteChampionshipMatchSQL,
    matchDoneSQL,
    postChampionShipMatchSQL,
    fetchEvidanceImgSQL,
    getChampionShipDataSQL,
    getChampionShipParticipationTeamSQL,
    fetchChampionshipMatchesSQL,
    fetchTeamInfoSQL,
    fetchMatchStatsSQL,
    fetchChampionShipMatchSQL,
    getChampionShipPlayerStatsSQL
}