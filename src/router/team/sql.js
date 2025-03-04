const getTeamListSQL = 
`
WITH captain_data AS (
    SELECT 
        team.member.team_list_idx, 
        player.list.player_list_idx, 
        player.list.player_list_nickname, 
        player.list.player_list_profile_image
    FROM team.member
    JOIN player.list ON team.member.player_list_idx = player.list.player_list_idx
    WHERE team.member.team_role_idx = 0
)
SELECT 
    community.team.community_list_idx,
    team.list.team_list_idx,
    team.list.team_list_name,
    team.list.team_list_short_name,
    team.list.team_list_color,
    team.list.team_list_emblem,
    team.list.team_list_created_at,
    COUNT(team.member.player_list_idx) AS total_members,
    captain_data.player_list_idx AS captain_idx,
    captain_data.player_list_nickname AS captain_name,
    captain_data.player_list_profile_image AS captain_profile_image
FROM team.list
LEFT JOIN community.team ON team.list.team_list_idx = community.team.team_list_idx
LEFT JOIN team.member ON team.list.team_list_idx = team.member.team_list_idx
LEFT JOIN captain_data ON team.list.team_list_idx = captain_data.team_list_idx
GROUP BY 
    community.team.community_list_idx,
    team.list.team_list_idx,
    team.list.team_list_name,
    team.list.team_list_short_name,
    team.list.team_list_color,
    team.list.team_list_emblem,
    team.list.team_list_created_at,
    captain_data.player_list_idx,
    captain_data.player_list_nickname,
    captain_data.player_list_profile_image
ORDER BY team.list.team_list_created_at DESC
LIMIT 10 OFFSET $1;
`


const postTeamSQL = 
`
INSERT INTO team.list (
    team_list_name, team_list_short_name, team_list_color,
    team_list_announcement, common_status_idx
) VALUES ($1, $2, $3, $4, $5)
RETURNING team_list_idx;
`

const postTeamManagerSQL =
`
INSERT INTO team.member (
    team_list_idx, player_list_idx, team_role_idx
) VALUES ($1, $2, 0);
`

const getTeamSQL = 
`
SELECT 
    team.list.team_list_idx,
    team.list.team_list_name,
    team.list.team_list_short_name,
    team.list.team_list_color,
    team.list.team_list_emblem,
    team.list.team_list_banner,
    team.list.team_list_announcement,
    team.list.common_status_idx,
    team.list.team_list_created_at,
    team.list.team_list_updated_at,
    community.list.community_list_idx
FROM 
    team.list
LEFT JOIN 
    community.team ON team.list.team_list_idx = community.team.team_list_idx
LEFT JOIN 
    community.list ON community.team.community_list_idx = community.list.community_list_idx
WHERE 
    team.list.team_list_idx = $1;
`

const getMemberSQL =
`
SELECT 
    player.list.player_list_idx,
    player.list.player_list_nickname,
    player.list.player_list_profile_image,
    team.member.team_role_idx
FROM 
    team.member
JOIN 
    player.list ON team.member.player_list_idx = player.list.player_list_idx
JOIN 
    team.role ON team.member.team_role_idx = team.role.team_role_idx
WHERE 
    team.member.team_list_idx = $1
ORDER BY 
    player.list.player_list_idx ASC
LIMIT 
    10 OFFSET $2;
`

module.exports = {
    getTeamListSQL,
    postTeamSQL,
    postTeamManagerSQL,
    getTeamSQL,
    getMemberSQL
}