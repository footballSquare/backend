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
    player.list.player_list_profile_image,
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

// 운영진 가입 승인
const communityStaffAccessSQL =
`
INSERT INTO community.staff (
    community_list_idx,
    player_list_idx,
    community_role_idx
) VALUES ($1, $2, 1);
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
WHERE player_list_idx = $1;
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
    player.list.player_list_profile_image
FROM 
    community.waitlist
JOIN 
    player.list ON community.waitlist.player_list_idx = player.list.player_list_idx
WHERE 
    community.waitlist.community_list_idx = $1
ORDER BY 
    community.waitlist.community_waitlist_created_at DESC;
`

module.exports = {
    getCommunitySQL,
    getCommunityStaffSQL,
    communityStaffAccessSQL,
    communityStaffAccessDenySQL,
    kickCommunityStaffSQL,
    communityStaffApplicationSQL,
    getCommunityStaffApplicationSQL
}