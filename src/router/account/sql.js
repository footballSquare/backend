// 로그인 및 토큰
const checkUserPasswordSQL = `
SELECT 
    player_list_password
FROM 
    player.list
WHERE 
    player_list_id = $1
`;
const signinSQL = `
SELECT 
    p.player_list_player_status AS player_status,
    p.player_list_idx AS user_idx,
    p.player_list_profile_image AS profile_image,
    tm.team_list_idx AS team_idx
FROM 
    player.list p
LEFT JOIN 
    team.member tm ON p.player_list_idx = tm.player_list_idx
WHERE 
    p.player_list_id = $1;
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
// 위에 3개 하나의 sql문으로 묶는 방법도 고려해보자.
const putRefreshtokenSQL = `
UPDATE player.list
SET
    player_list_refreshtoken = $1,
    player_list_refreshtoken_expires_at = $2
WHERE
    player_list_idx = $3
`;
const checkRefreshtokenSQL = `
SELECT 
    player_list_idx AS user_idx,
    player_list_team_idx AS team_idx,
    player_list_refreshtoken_expires_at AS expires_at
FROM 
    player.list
WHERE 
    player_list_refreshtoken = $1
`;
// 중복 값 체크
const checkDuplicateIdSQL = `
SELECT EXISTS (
    SELECT 1
    FROM player.list
    WHERE player_list_id = $1
) AS exists_flag
`;
const checkDuplicateNicknameSQL = `
SELECT EXISTS (
    SELECT 1
    FROM player.list
    WHERE player_list_nickname = $1
) AS exists_flag
`;
// 회원가입
const signupLoginInfoSQL = `
INSERT INTO player.list (
    player_list_id,
    player_list_password,
    player_list_player_status
) VALUES (
    $1, $2, 'pending'
)
`;
const getUserIdxSQL = `
SELECT 
    player_list_idx AS user_idx,
    player_list_player_status AS player_status
FROM 
    player.list
WHERE 
    player_list_id = $1
`;
const signupPlayerInfoSQL = `
UPDATE player.list
SET
    player_list_team_idx = $1,
    player_list_nickname = $2,
    player_list_platform = $3,
    player_list_state = $4,
    player_list_message = $5,
    player_list_discord_tag = $6,
    player_list_player_status = 'active',
    player_list_active_at = now()
WHERE
    player_list_idx = $7
`;
const checkUserSQL = `
SELECT EXISTS (
    SELECT 1
    FROM player.list
    WHERE player_list_idx = $1
) AS exists_flag
`;
// 회원 삭제
const softDeleteSQL = `
UPDATE player.list
SET 
    player_list_player_status = 'deleted',
    player_list_deleted_at = now()
WHERE 
    player_list_idx = $1
`;
// 회원 정보 가져오기
const getMyInfoSQL = `
SELECT 
    player_list_idx AS user_idx,
    player_list_phone AS phone,
    player_list_id AS id,
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
    player_list_player_status AS common_status_idx
FROM 
    player.list
WHERE 
    player_list_idx = $1
`;
// 비밀번호 체크
const checkPasswordSQL = `
SELECT 
    player_list_password AS player_list_password
FROM
    player.list
WHERE
    player_list_idx = $1
`;
// 회원 정보 업데이트
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
const getUserImageSQL = `
SELECT 
    player_list_profile_image AS profile_image
FROM 
    player.list
WHERE 
    player_list_idx = $1
`;
const updateProfileImageSQL = `
UPDATE player.list
SET
    player_list_profile_image = $1
WHERE
    player_list_idx = $2
`;
// discord oauth
const signinDiscordOauth = `
SELECT 
    p.player_list_player_status AS player_status,
    p.player_list_idx AS user_idx,
    p.player_list_profile_image AS profile_image,
    tm.team_list_idx AS team_idx
FROM 
    player.list p
LEFT JOIN 
    team.member tm ON p.player_list_idx = tm.player_list_idx
WHERE 
    p.player_list_discord_id = $1;
`;
const signupDiscordOauth = `
INSERT INTO player.list (
    player_list_discord_id,
    player_list_discord_tag,
    player_list_player_status
) VALUES (
    $1, $2, 'pending'
)
`;
const getUserIdxDiscordOauthSQL = `
SELECT 
    player_list_idx AS user_idx,
    player_list_player_status AS player_status,
    player_list_discord_tag AS discord_tag
FROM 
    player.list
WHERE 
    player_list_discord_id = $1
`;

module.exports = {
  checkUserPasswordSQL,
  signinSQL,
  checkTeamRoleSQL,
  checkCommunityRoleSQL,
  putRefreshtokenSQL,
  checkDuplicateIdSQL,
  checkDuplicateNicknameSQL,
  signupLoginInfoSQL,
  getUserIdxSQL,
  signupPlayerInfoSQL,
  checkRefreshtokenSQL,
  softDeleteSQL,
  getMyInfoSQL,
  getUserInfoSQL,
  checkPasswordSQL,
  updateUserInfoSQL,
  getUserImageSQL,
  updateProfileImageSQL,
  signinDiscordOauth,
  signupDiscordOauth,
  getUserIdxDiscordOauthSQL,
  checkUserSQL,
};
