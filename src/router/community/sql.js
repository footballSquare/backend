const { 
    BOARD_CATEGORY
} = require("../../constant/constantIndex")

// 게시글 목록 가져오기
const getCommunityBoardListSQL =
`
SELECT 
    bl.board_list_idx,
    bl.board_category_idx,
    bl.board_list_title,
    bl.player_list_idx,
    bl.board_list_img,
    bl.board_list_created_at,
    bl.board_list_updated_at,
    bl.board_list_likecount,
    bl.community_list_idx,
    bl.community_list_idx,
    pl.player_list_nickname,
    pl.player_list_profile_image
FROM board.list bl
LEFT JOIN player.list pl ON bl.player_list_idx = pl.player_list_idx
WHERE bl.community_list_idx = $1
ORDER BY bl.board_list_created_at DESC
LIMIT 10 OFFSET ($2 * 10);
`

// 커뮤니티 게시글 작성하기
const postCommunityBoardSQL = 
`
INSERT INTO board.list (
    board_category_idx, 
    board_list_title, 
    board_list_content, 
    player_list_idx, 
    board_list_img, 
    board_list_created_at, 
    board_list_updated_at,
    community_list_idx
) VALUES (
    ${BOARD_CATEGORY.COMMUNITY_BOARD}, $1, $2, $3, to_jsonb(array[$4]), now(), now(), $5
)
`

// 커뮤니티 정보 가져오기 SQL
const getCommunitySQL = 
`
SELECT 
    community.list.community_list_idx,
    community.list.community_list_name,
    community.list.community_list_notice,
    community.list.community_list_banner,
    community.list.community_list_emblem
FROM 
    community.list
WHERE 
    community.list.community_list_idx = $1;
`

// 커뮤니티 운영진 목록 가져오기
const getCommunityStaffSQL = 
`
SELECT 
    player.list.player_list_idx,
    player.list.player_list_nickname,
    player_list_platform,
    player.list.player_list_profile_image AS player_list_profile_img,
    community.staff.community_role_idx,
    community.staff.community_staff_joined_at
FROM 
    community.staff
JOIN 
    player.list ON community.staff.player_list_idx = player.list.player_list_idx
WHERE 
    community.staff.community_list_idx = $1
ORDER BY 
    community.staff.community_role_idx ASC, 
    player.list.player_list_idx ASC;  
`

// 커뮤니티 소속팀 목록 가져오기
const getCommunityTeamSQL =
`
SELECT 
    team.list.team_list_idx,
    team.list.team_list_name,
    team.list.team_list_short_name,
    team.list.team_list_color,
    team.list.team_list_emblem,
    community.team.community_team_joined_at
FROM 
    community.team
JOIN 
    team.list ON community.team.team_list_idx = team.list.team_list_idx
WHERE 
    community.team.community_list_idx = $1
ORDER BY 
    community.team.community_team_joined_at DESC
LIMIT 10 OFFSET $2 * 10;
`

// 커뮤니티 진행 대회 목록 가져오기
const getCommunityChampionshipSQL = 
`
SELECT 
    championship_list_idx,
    championship_type_idx,
    championship_list_name,
    championship_list_description,
    match_type_idx,
    championship_list_throphy_img,
    championship_list_start_date,
    championship_list_end_date,
    championship_list_color,
    common_status_idx
FROM championship.list
WHERE community_list_idx = $1
ORDER BY championship_list_start_date DESC
LIMIT 10 OFFSET $2 * 10;
`

const putCommunityNoticeSQL =
`
UPDATE community.list SET community_list_notice = $2 WHERE community_list_idx = $1
`

// 대회 생성
const postChampioshipSQL =
`
INSERT INTO championship.list (
    community_list_idx, 
    championship_type_idx, 
    championship_list_name, 
    championship_list_description, 
    match_type_idx, 
    championship_list_throphy_img, 
    championship_list_color,
    championship_list_start_date, 
    championship_list_end_date, 
    common_status_idx
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING championship_list_idx;
`

// 대회 참가 팀 추가
const postChampioshipParticipantTeamSQL = 
`
INSERT INTO championship.participation_team (
    championship_list_idx,
    team_list_idx,
    team_list_name
)
SELECT 
    $1, 
    t.team_list_idx, 
    t.team_list_name
FROM unnest($2::int[]) AS team_idx(team_list_idx)
JOIN team.list t ON team_idx.team_list_idx = t.team_list_idx;
`

// 대회 수상 추가
const postChampioshipAwardSQL =
`
INSERT INTO championship.award (
  championship_list_idx, 
  championship_award_name, 
  championship_award_throphy_image
)
SELECT 
  $1, name, image
FROM unnest($2::text[], $3::text[]) AS t(name, image);
`

// 운영진 가입 승인
const communityStaffAccessSQL =
`
INSERT INTO community.staff (
    community_list_idx,
    player_list_idx,
    community_role_idx
) VALUES ($1, $2, $3);
`

// 운영진 가입 거절
const communityStaffAccessDenySQL =
`
DELETE FROM community.waitlist
WHERE community_list_idx = $1
AND player_list_idx = $2;
`


// 커뮤니티 운영진 추방
const kickCommunityStaffSQL = 
`
DELETE FROM community.staff
WHERE player_list_idx = $1
AND community_list_idx = $2;
`

// 커뮤니티 운영진 가입 신청
const communityStaffApplicationSQL = 
`
INSERT INTO community.waitlist (
    community_list_idx,
    player_list_idx
) VALUES (
    $1,
    $2
)
`

// 커뮤니티 운영진 가입 신청 목록 가져오기
const getCommunityStaffApplicationSQL =
`
SELECT 
    player.list.player_list_idx,
    player.list.player_list_nickname,
    player_list_platform,
    player.list.player_list_profile_image AS player_list_profile_img
FROM 
    community.waitlist
JOIN 
    player.list ON community.waitlist.player_list_idx = player.list.player_list_idx
WHERE 
    community.waitlist.community_list_idx = $1
ORDER BY 
    community.waitlist.community_waitlist_created_at DESC;
`

// 팀 가입 신청 보기
const getCommunityTeamApplicationSQL = 
`
SELECT 
    team.list.team_list_idx,
    team.list.team_list_name,
    team.list.team_list_short_name,
    team.list.team_list_color,
    team.list.team_list_emblem
FROM 
    community.team_waitlist
JOIN 
    team.list ON community.team_waitlist.team_list_idx = team.list.team_list_idx
WHERE 
    community.team_waitlist.community_list_idx = $1
ORDER BY 
    community.team_waitlist.team_waitlist_created_at DESC;
`

// 소속팀 가입 신청 sql
const communityTeamApplicationSQL = 
`
INSERT INTO community.team_waitlist (
    community_list_idx,
    team_list_idx
) VALUES (
    $1,  
    $2
)
`

// 소속 팀 가입신청 승인
const communityTeamAccessSQL = 
`
INSERT INTO community.team (
    community_list_idx,
    team_list_idx
) VALUES ($1, $2);
`

// 소속팀 가입신청 삭제 SQL
const communityTeamAccessDenySQL = 
`
DELETE FROM community.team_waitlist
WHERE community_list_idx = $1
AND team_list_idx = $2;
`

// 커뮤니티 소속 팀 추방
const communityTeamKickSQL =
`
DELETE FROM community.team
WHERE community_list_idx = $1
AND team_list_idx = $2;
`

module.exports = {
    getCommunityBoardListSQL,
    postCommunityBoardSQL,
    getCommunitySQL,
    getCommunityStaffSQL,
    getCommunityTeamSQL,
    getCommunityChampionshipSQL,
    putCommunityNoticeSQL,
    postChampioshipSQL,
    postChampioshipParticipantTeamSQL,
    postChampioshipAwardSQL,
    communityStaffAccessSQL,
    communityStaffAccessDenySQL,
    kickCommunityStaffSQL,
    communityStaffApplicationSQL,
    getCommunityStaffApplicationSQL,
    getCommunityTeamApplicationSQL,
    communityTeamApplicationSQL,
    communityTeamAccessSQL,
    communityTeamAccessDenySQL,
    communityTeamKickSQL
}