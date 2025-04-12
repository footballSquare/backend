const { 
    COMMON_STATUS,
    TEAM_ROLE
} = require("../../constant/constantIndex")

const getTeamListSQL = 
`
WITH captain_data AS (
    SELECT 
        tm.team_list_idx, 
        pl.player_list_idx, 
        pl.player_list_nickname, 
        pl.player_list_profile_image
    FROM team.member tm
    JOIN player.list pl ON tm.player_list_idx = pl.player_list_idx
    WHERE tm.team_role_idx = ${TEAM_ROLE.LEADER}
),
waitlist_data AS (
    SELECT 
        team_list_idx, 
        TRUE AS is_waiting
    FROM team.waitlist
    WHERE player_list_idx = $2 
)
SELECT 
    ct.community_list_idx,
    tl.team_list_idx,
    tl.team_list_name,
    tl.team_list_short_name,
    tl.team_list_color,
    tl.team_list_emblem,
    tl.team_list_created_at,
    tl.common_status_idx,
    COUNT(tm.player_list_idx) AS whole_member,
    cd.player_list_idx AS player_list_idx,
    cd.player_list_nickname AS player_list_name,
    cd.player_list_profile_image AS player_list_profile_image,
    COALESCE(wd.is_waiting, FALSE) AS is_waiting
FROM team.list tl
LEFT JOIN community.team ct ON tl.team_list_idx = ct.team_list_idx
LEFT JOIN team.member tm ON tl.team_list_idx = tm.team_list_idx
LEFT JOIN captain_data cd ON tl.team_list_idx = cd.team_list_idx
LEFT JOIN waitlist_data wd ON tl.team_list_idx = wd.team_list_idx
GROUP BY 
    ct.community_list_idx,
    tl.team_list_idx,
    tl.team_list_name,
    tl.team_list_short_name,
    tl.team_list_color,
    tl.team_list_emblem,
    tl.team_list_created_at,
    tl.common_status_idx,
    cd.player_list_idx,
    cd.player_list_nickname,
    cd.player_list_profile_image,
    wd.is_waiting
ORDER BY tl.team_list_created_at DESC
LIMIT 10 OFFSET $1 * 10;
`

const getRecruitingTeamListSQL = 
`
WITH captain_data AS (
    SELECT 
        tm.team_list_idx, 
        pl.player_list_idx, 
        pl.player_list_nickname, 
        pl.player_list_profile_image
    FROM team.member tm
    JOIN player.list pl ON tm.player_list_idx = pl.player_list_idx
    WHERE tm.team_role_idx = ${TEAM_ROLE.LEADER}
),
waitlist_data AS (
    SELECT 
        team_list_idx, 
        TRUE AS is_waiting
    FROM team.waitlist
    WHERE player_list_idx = $2
)
SELECT 
    ct.community_list_idx,
    tl.team_list_idx,
    tl.team_list_name,
    tl.team_list_short_name,
    tl.team_list_color,
    tl.team_list_emblem,
    tl.team_list_created_at,
    tl.common_status_idx,
    COUNT(tm.player_list_idx) AS whole_member,
    cd.player_list_idx AS player_list_idx,
    cd.player_list_nickname AS player_list_name,
    cd.player_list_profile_image AS player_list_profile_image,
    COALESCE(wd.is_waiting, FALSE) AS is_waiting
FROM team.list tl
LEFT JOIN community.team ct ON tl.team_list_idx = ct.team_list_idx
LEFT JOIN team.member tm ON tl.team_list_idx = tm.team_list_idx
LEFT JOIN captain_data cd ON tl.team_list_idx = cd.team_list_idx
LEFT JOIN waitlist_data wd ON tl.team_list_idx = wd.team_list_idx
WHERE tl.common_status_idx = ${COMMON_STATUS.TEAM_RECRUITING}
GROUP BY 
    ct.community_list_idx,
    tl.team_list_idx,
    tl.team_list_name,
    tl.team_list_short_name,
    tl.team_list_color,
    tl.team_list_emblem,
    tl.team_list_created_at,
    tl.common_status_idx,
    cd.player_list_idx,
    cd.player_list_nickname,
    cd.player_list_profile_image,
    wd.is_waiting
ORDER BY tl.team_list_created_at DESC
LIMIT 10 OFFSET $1 * 10;
`


const postTeamSQL = 
`
INSERT INTO team.list (
    team_list_name, team_list_short_name, team_list_color,
    team_list_announcement, common_status_idx
) VALUES ($1, $2, $3, $4, $5)
RETURNING team_list_idx;
`

// 팀 해체하기
const deleteTeamSQL =
`
DELETE FROM team.list WHERE team_list_idx = $1;
`

const postTeamManagerSQL =
`
INSERT INTO team.member (
    team_list_idx, player_list_idx, team_role_idx
) VALUES ($1, $2, $3);
`

// 팀 수상 목록
const getTeamAwardSQL = 
`
SELECT 
  w.championship_winner_idx,
  w.championship_list_idx,
  cl.championship_list_name,
  cl.championship_list_start_date,
  cl.championship_list_end_date,
  cl.championship_list_color,
  cl.championship_list_throphy_img
FROM championship.winner w
JOIN championship.list cl 
  ON w.championship_list_idx = cl.championship_list_idx
WHERE w.team_list_idx = $1
ORDER BY cl.championship_list_start_date DESC;
`

// 팀 연혁 추가
const postTeamHistorySQL =
`
INSERT INTO team.history (
    team_list_idx,
    team_list_name,
    team_history_created_at
)
VALUES (
    $1,  -- team_list_idx
    $2,  -- team_list_name
    now()
);
`

const getTeamSQL = 
`
SELECT 
    t.team_list_idx,
    t.team_list_name,
    t.team_list_short_name,
    t.team_list_color,
    t.team_list_emblem,
    t.team_list_banner,
    t.team_list_announcement,
    t.common_status_idx,
    t.team_list_created_at,
    t.team_list_updated_at,
    cl.community_list_idx,
    COALESCE(w.team_waiting, FALSE) AS is_waiting
FROM 
    team.list t
LEFT JOIN 
    community.team ct ON t.team_list_idx = ct.team_list_idx
LEFT JOIN 
    community.list cl ON ct.community_list_idx = cl.community_list_idx
LEFT JOIN (
    SELECT team_list_idx, TRUE AS team_waiting
    FROM team.waitlist
    WHERE player_list_idx = $2
) w ON t.team_list_idx = w.team_list_idx
WHERE 
    t.team_list_idx = $1;
`

const getMemberSQL =
`
SELECT 
    player.list.player_list_idx,
    player.list.player_list_nickname,
    player.list.player_list_profile_image,
    player.list.player_list_platform,
    team.member.team_role_idx
FROM 
    team.member
JOIN 
    player.list ON team.member.player_list_idx = player.list.player_list_idx
WHERE 
    team.member.team_list_idx = $1
ORDER BY 
    player.list.player_list_idx ASC
LIMIT 
    10 
OFFSET 
    $2 * 10;
`

// 팀 연혁 가져오기
const getTeamHistorySQL =
`
SELECT 
    team_history_idx,
    team_list_idx,
    team_list_name,
    team_history_created_at
FROM 
    team.history
WHERE 
    team_list_idx = $1
ORDER BY 
    team_history_created_at DESC;
`

// 팀 멤버 추가하기 SQL
const insertTeamMemberSQL = `
INSERT INTO team.member (
    team_list_idx,
    player_list_idx,
    team_role_idx,
    team_member_joined_at
) VALUES ($1, $2, $3, NOW());
`;

// 멤버 가입 신청 거절
const teamMemberDenySQL = 
`
DELETE FROM 
    team.waitlist
WHERE 
    team_list_idx = $1 
AND 
    player_list_idx = $2;
`

// 멤버 가입 승인시, 모든 팀 가입 대기자 목록에서 삭제
const deleteTeamMemeberSQL = 
`
DELETE FROM 
    team.waitlist
WHERE 
    player_list_idx = $1;
`

// 팀 멤버 역할 변경
const changeMemberRoleSQL =
`
UPDATE team.member
SET team_role_idx = $3
WHERE team_list_idx = $1 AND player_list_idx = $2;
`

// 팀 멤버 추방 SQL
const kickMemberSQL = 
`
DELETE FROM team.member
WHERE team_list_idx = $1
AND player_list_idx = $2;
`

const teamApplicationSQL =
`
INSERT INTO team.waitlist (
    team_list_idx,
    player_list_idx
) VALUES ($1, $2);
`

// 팀 가입 신청 인원 목록 보기 
const teamApplicationListSQL =
`
SELECT 
    player.list.player_list_idx,
    player.list.player_list_nickname,
    player.list.player_list_profile_image,
    player.list.player_list_platform,
    team.waitlist.team_waitlist_created_at
FROM team.waitlist
JOIN player.list
    ON team.waitlist.player_list_idx = player.list.player_list_idx
WHERE team.waitlist.team_list_idx = $1
ORDER BY team.waitlist.team_waitlist_created_at DESC;
`

// 팀 정보 변경
const changeTeamDataSQL =
`
UPDATE team.list
SET 
    team_list_name = $2,
    team_list_short_name = $3,
    team_list_color = $4,
    team_list_announcement = $5,
    common_status_idx = $6,
    team_list_updated_at = NOW()
WHERE team_list_idx = $1;
`

// 팀명 중복 확인
const checkTeamNameSQL = 
`
SELECT team_list_idx 
FROM team.list 
WHERE team_list_name = $1;
`

// 팀 약칭 중복 확인
const checkTeamShortNameSQL = 
`
SELECT team_list_idx 
FROM team.list 
WHERE team_list_short_name = $1;
`

// 팀 엠블렘 변경 sql
const changeTeamEmblemSQL =
`
UPDATE team.list
SET team_list_emblem = $2
WHERE team_list_idx = $1;
`


module.exports = {
    getTeamListSQL,
    getRecruitingTeamListSQL,
    postTeamSQL,
    postTeamManagerSQL,
    postTeamHistorySQL,
    changeTeamDataSQL,
    checkTeamNameSQL,
    checkTeamShortNameSQL,
    deleteTeamSQL,
    getTeamSQL,
    getMemberSQL,
    getTeamAwardSQL,
    getTeamHistorySQL,
    insertTeamMemberSQL,
    teamMemberDenySQL,
    deleteTeamMemeberSQL,
    changeMemberRoleSQL,
    kickMemberSQL,
    teamApplicationSQL,
    teamApplicationListSQL,
    changeTeamEmblemSQL
}