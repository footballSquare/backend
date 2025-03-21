const signinUserInfoSQL = `
SELECT 
    player_list_player_status AS player_status,
    player_list_idx AS user_idx,
    player_list_profile_image AS profile_image,
    player_list_team_idx AS team_idx
FROM 
    player.list
WHERE 
    player_list_id = $1
    AND player_list_password = $2
`;
const checkTeamRoleSQL = `
SELECT 
    team_role_idx
FROM 
    team.member
WHERE 
    player_list_idx = $1
`;
const checkCommunityRoleSQL = `
SELECT 
    community_role_idx
FROM 
    community.staff
WHERE 
    player_list_idx = $1
`;
const putRefreshtokenSQL = `
UPDATE player.list
SET
    player_list_refreshtoken = $1,
    player_list_refreshtoken_expires_at = $2
WHERE
    player_list_idx = $3
`;
const checkDuplicateIdSQL = `
SELECT EXISTS (
    SELECT 1
    FROM player.list
    WHERE player_list_id = $1
) AS exists_flag
`;
// const result = await db.query(`
//     SELECT EXISTS (
//       SELECT 1 FROM player.list WHERE player_list_id = $1
//     ) AS exists_flag
//   `, [id]);

// const exists = result.rows[0].exists_flag; 가 true or false
const checkDuplicateNicknameSQL = `
SELECT EXISTS (
    SELECT 1
    FROM player.list
    WHERE player_list_nickname = $1
) AS exists_flag
`;
const signupLoginInfoSQL = `
INSERT INTO player.list (
    player_list_id,
    player_list_password,
    player_list_nickname,
    player_list_player_status
) VALUES (
    $1, $2, $3, 'pending'
)
`;
const signupPlayerInfoSQL = `
UPDATE player.list
SET
    player_list_team_idx = $1,
    player_list_platform = $2,
    player_list_state = $3,
    player_list_message = $4,
    player_list_discord_tag = $5
WHERE
    player_list_idx = $6
`;
const checkRefreshtokenSQL = `
SELECT 
    player_list_idx AS idx,
    player_list_refreshtoken_expires_at AS expires_at
FROM 
    player.list
WHERE 
    player_list_refreshtoken = $1
`;
const softDeleteSQL = `
UPDATE player.list
SET 
    player_list_player_status = 'deleted',
    player_list_deleted_at = now()
WHERE 
    player_list_idx = $1
`;
const getMyInfoSQL = `
SELECT 
    player_list_idx AS user_idx,
    player_list_phone AS phone,
    player_list_id AS id,
    player_list_password AS password,
    player_list_discord_id AS discord_id,
    player_list_name AS name,
    player_list_nickname AS nickname,
    player_list_team_idx AS team_idx,
    player_list_profile_image AS profile_image,
    player_list_platform AS platform,
    player_list_state AS state,
    player_list_message AS message,
    player_list_discord_tag AS discord_tag,
    player_list_MMR AS MMR,
    player_list_player_status AS player_status
FROM 
    player.list
WHERE 
    player_list_idx = $1
`;
const getUserInfoSQL = `
SELECT 
    player_list_idx AS user_idx,
    player_list_nickname AS nickname,
    player_list_team_idx AS team_idx,
    player_list_profile_image AS profile_image,
    player_list_platform AS platform,
    player_list_state AS state,
    player_list_message AS message,
    player_list_discord_tag AS discord_tag,
    player_list_MMR AS MMR,
    player_list_player_status AS player_status
FROM 
    player.list
WHERE 
    player_list_idx = $1
`;
const updateUserInfoSQL = `
UPDATE player.list
SET
    player_list_id = $1,
    player_list_password = $2,
    player_list_nickname = $3,
    player_list_team_idx = $4,
    player_list_platform = $5,
    player_list_state = $6,
    player_list_message = $7,
    player_list_discord_tag = $8
WHERE
    player_list_idx = $9
`;
const updateProfileImageSQL = `
UPDATE player.list
SET
    player_list_profile_image = $1
WHERE
    player_list_idx = $2
`;
