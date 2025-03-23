const client = require("../../database/postgreSQL");
const customError = require("../../util/customError");
const trycatchWrapper = require("./../../util/trycatchWrapper");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const {
  checkUserPasswordSQL,
  signinUserInfoSQL,
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
  updateUserInfoSQL,
  getUserImageSQL,
  updateProfileImageSQL,
} = require("./sql");

const {
  regIdx,
  regId,
  regPw,
  regNickname,
  regPlatform,
  regState,
  regMessage,
  regDiscordTag,
} = require("./../../constant/regx");

// 로그인 및 토큰 =================================================================
const checkPassword = async (req, res, next) => {
  const { id, password } = req.query;

  const result = await client.query(checkUserPasswordSQL, [id]);

  if (result.rows.length === 0) {
    throw customError(404, "등록되지 않은 유저입니다.");
  }

  const hashedPassword = result.rows[0].player_list_password;

  const isMatch = await bcrypt.compare(password, hashedPassword);

  if (!isMatch) {
    throw customError(401, "비밀번호가 틀렸습니다.");
  }

  next();
};

const signinLogin = async (req, res, next) => {
  const { id } = req.query;

  const result = await client.query(signinUserInfoSQL, [id]);

  const userIdx = result.rows[0].user_idx;

  const playerStatus = result.rows[0].player_status;
  if (playerStatus === "pending") {
    res.status(200).send({
      data: {
        player_status: playerStatus,
        user_idx: userIdx,
      },
    });
    return;
  }

  const profileImage = result.rows[0].profile_image || null;
  const teamIdx = result.rows[0].team_idx || null;

  const teamRoleIdx = await getTeamRoleIdx(userIdx);
  const communityRoleIdx = await getCommunityRoleIdx(userIdx);

  const accessToken = setAccessToken(
    userIdx,
    teamIdx,
    teamRoleIdx,
    communityRoleIdx
  );
  const refreshToken = setRefreshToken();

  await putRefreshToken(refreshToken, userIdx);

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: false, // true면 https 오는 요청만 받음
    sameSite: "strict",
    maxAge: 3 * 24 * 60 * 60 * 1000,
  });

  // 응답 구성
  res.status(200).send({
    player_status: playerStatus,
    access_token: accessToken,
    user_idx: userIdx,
    profile_image: profileImage,
    team_idx: teamIdx,
    team_role_idx: teamRoleIdx,
    community_role_idx: communityRoleIdx,
  });
};

const checkRefreshToken = async (req, res, next) => {
  const refreshToken = req.cookies?.refresh_token;

  if (!refreshToken) {
    throw customError(401, "refresh token이 없습니다.");
  }

  const result = await client.query(checkRefreshtokenSQL, [refreshToken]);

  if (result.rows.length === 0) {
    throw customError(403, "잘못된 refresh token 입니다.");
  }

  const expiresAt = new Date(result.rows[0].expires_at);
  const now = new Date();

  if (now >= expiresAt) {
    throw customError(401, "만료된 refresh token 입니다.");
  }

  const userIdx = result.rows[0].user_idx;
  const teamIdx = result.rows[0].team_idx;
  const teamRoleIdx = await getTeamRoleIdx(userIdx);
  const communityRoleIdx = await getCommunityRoleIdx(userIdx);

  const accessToken = setAccessToken(
    userIdx,
    teamIdx,
    teamRoleIdx,
    communityRoleIdx
  );

  res.status(200).send({
    access_token: accessToken,
  });
};

async function getTeamRoleIdx(userIdx) {
  const result = await client.query(checkTeamRoleSQL, [userIdx]);
  return result.rows.length > 0 ? result.rows[0].team_role_idx : null;
}
async function getCommunityRoleIdx(userIdx) {
  const result = await client.query(checkCommunityRoleSQL, [userIdx]);
  return result.rows.length > 0 ? result.rows[0].community_role_idx : null;
}

async function putRefreshToken(refreshToken, userIdx) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 3);
  const putRefreshtoken = await client.query(putRefreshtokenSQL, [
    refreshToken,
    expiresAt,
    userIdx,
  ]);
}
function setAccessToken(userIdx, teamIdx, teamRoleIdx, communityRoleIdx) {
  const accessToken = jwt.sign(
    {
      my_player_list_idx: userIdx,
      my_team_list_idx: teamIdx ?? null,
      my_team_role_idx: teamRoleIdx ?? null,
      my_community_role_idx: communityRoleIdx ?? null,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "2h",
    }
  );
  return accessToken;
}
function setRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}

// 중복 값 체크(아이디, 닉네임임) ========================================
const checkDuplicateId = async (req, res, next) => {
  const { id } = req.body;

  const result = await client.query(checkDuplicateIdSQL, [id]);

  const exists = result.rows[0]?.exists_flag;

  if (exists === undefined) {
    throw customError(500, "중복 확인 실패");
  }

  if (exists) {
    throw customError(409, "id 중복");
  }
  res.status(200).send({});
};

const checkDuplicateNickname = async (req, res, next) => {
  const { nickname } = req.body;

  const result = await client.query(checkDuplicateNicknameSQL, [nickname]);

  const exists = result.rows[0]?.exists_flag;

  if (exists === undefined) {
    throw customError(500, "중복 확인 실패");
  }

  if (exists) {
    throw customError(409, "nickname 중복");
  }
  res.status(200).send({});
};

// 회원가입 =================================================================
const signupLoginInfo = async (req, res, next) => {
  const { id, password, nickname } = req.body;

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const result = await client.query(signupLoginInfoSQL, [
    id,
    hashedPassword,
    nickname,
  ]);

  const userIdxResult = await client.query(getUserIdxSQL, [id]);
  const userIdx = userIdxResult.rows[0]?.user_idx;

  if (!userIdx) {
    throw customError(500, "user_idx 조회 실패");
  }
  res.status(200).send({
    player_status: "pending",
    user_idx: userIdx,
  });
};

const signupPlayerInfo = async (req, res, next) => {
  let { user_idx, team_idx, platform, state, message, discord_tag } = req.body;

  if (!user_idx) {
    throw customError(400, "user_idx는 필수값입니다.");
  }

  team_idx = validate(regIdx, team_idx);
  platform = validate(regPlatform, platform);
  state = validate(regState, state);
  message = validate(regMessage, message);
  discord_tag = validate(regDiscordTag, discord_tag);

  const result = await client.query(signupPlayerInfoSQL, [
    team_idx,
    platform,
    state,
    message,
    discord_tag,
    user_idx,
  ]);

  res.status(200).send({
    message: "회원가입에 성공했습니다.",
  });
};

// 토큰 =================================================================

// 회원 삭제(soft delete) =================================================================
const accountSoftDelete = async (req, res, next) => {
  const { idx } = req.decoded;

  const result = await client.query(softDeleteSQL, [idx]);

  res.status(200).send({
    message: "회원 탈퇴에 성공했습니다.",
  });
};

// 회원 정보 가져오기 =================================================================
const getMyInfo = async (req, res, next) => {
  const { idx } = req.decoded;
  const result = await client.query(getMyInfoSQL, [idx]);
  if (result.rows.length === 0) {
    throw customError(404, "등록되지 않은 유저입니다.");
  }
  res.status(200).send({
    data: result.rows[0],
  });
};

const getUserInfo = async (req, res, next) => {
  const userIdx = req.params.idx;
  const { authorization } = req.headers;
  let isMine = false;

  if (authorization) {
    const { idx } = jwt.verify(authorization, process.env.ACCESS_TOKEN_SECRET);
    if (userIdx == idx) isMine = true;
  }

  const result = await client.query(getUserInfoSQL, [userIdx]);

  if (result.rows.length === 0) {
    throw customError(404, "등록되지 않은 유저입니다.");
  }

  result.rows[0].is_mine = isMine;

  res.status(200).send({
    data: result.rows[0],
  });
};

// 회원 정보 업데이트 =================================================================
const updateUserInfo = async (req, res, next) => {
  const { idx } = req.decoded;
  let {
    id,
    password,
    nickname,
    team_idx,
    platform,
    state,
    message,
    discord_tag,
  } = req.body;

  id = validate(regId, id);
  password = validate(regPw, password);
  nickname = validate(regNickname, nickname);
  team_idx = validate(regIdx, team_idx);
  platform = validate(regPlatform, platform);
  state = validate(regState, state);
  message = validate(regMessage, message);
  discord_tag = validate(regDiscordTag, discord_tag);

  const result = await client.query(updateUserInfoSQL, [
    id,
    password,
    nickname,
    team_idx,
    platform,
    state,
    message,
    discord_tag,
    idx,
  ]);

  res.status(200).send({
    message: "정보 수정 성공했습니다.",
  });
};

// 이미지 관련 =================================================================
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const uploadS3 = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      const fileName = Date.now().toString() + "-" + file.originalname;
      cb(null, fileName);
    },
  }),
});
const deleteImage = async (imageUrl) => {
  const fileName = imageUrl.split("/").pop();
  const deleteParams = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileName,
  };
  await s3.send(new DeleteObjectCommand(deleteParams));
};

const updateProfileImage = async (req, res, next) => {
  const { idx } = req.decoded;

  if (!req.file) throw customError(404, "이미지 파일이 존재하지 않습니다.");

  const oldImageResult = await client.query(getUserImageSQL, [idx]);

  if (oldImageResult.rows[0].profile_image) {
    const oldImageUrl = oldImageResult.rows[0].profile_image;
    await deleteImage(oldImageUrl);
  }

  const result = await client.query(updateProfileImageSQL, [
    req.file.location,
    idx,
  ]);

  res.status(200).send({ message: "이미지 수정 성공" });
};

// 많이 사용하는 기능은 함수 선언식 사용해서 저장
function validate(regex, value) {
  //js에서 함수 표현식은 호이스팅 되지 않기 때문에 함수 선언식으로 바꿈
  if (value == null) return null;
  if (!regex.test(value)) {
    throw customError(400, `형식이 올바르지 않습니다.`);
  }
  return value;
}

async function deleteRefreshToken(userIdx) {
  const result = await client.query(putRefreshTokenSQL, [null, null, userIdx]);
}

module.exports = {
  checkPassword: trycatchWrapper(checkPassword),
  signinLogin: trycatchWrapper(signinLogin),
  checkDuplicateId: trycatchWrapper(checkDuplicateId),
  checkDuplicateNickname: trycatchWrapper(checkDuplicateNickname),
  signupLoginInfo: trycatchWrapper(signupLoginInfo),
  signupPlayerInfo: trycatchWrapper(signupPlayerInfo),
  checkRefreshToken: trycatchWrapper(checkRefreshToken),
  accountSoftDelete: trycatchWrapper(accountSoftDelete),
  getMyInfo: trycatchWrapper(getMyInfo),
  getUserInfo: trycatchWrapper(getUserInfo),
  updateUserInfo: trycatchWrapper(updateUserInfo),
  updateProfileImage: trycatchWrapper(updateProfileImage),
  uploadS3,
};
