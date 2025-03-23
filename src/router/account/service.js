const client = require("../../database/postgreSQL");
const customError = require("../../util/customError");
const trycatchWrapper = require("./../../util/trycatchWrapper");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const {
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

const signinLogin = async (req, res, next) => {
  const { id, password } = req.body;

  const signinResult = await client.query(signinUserInfoSQL, [id, password]);

  if (signinResult.rows.length === 0) {
    throw customError(404, "등록되지 않은 유저입니다.");
  }

  const user = signinResult.rows[0];
  const userIdx = user.user_idx;

  // 기본 정보에서 player_status, user_idx는 항상 존재
  const playerStatus = user.player_status;
  const profileImage = user.profile_image || null;
  const teamIdx = user.team_idx || null;

  // 팀 역할 조회
  const teamRoleResult = await client.query(checkTeamRoleSQL, [userIdx]);
  const teamRoleIdx =
    teamRoleResult.rows.length > 0
      ? teamRoleResult.rows[0].team_role_idx
      : null;

  // 커뮤니티 역할 조회
  const communityRoleResult = await client.query(checkCommunityRoleSQL, [
    userIdx,
  ]);
  const communityRoleIdx =
    communityRoleResult.rows.length > 0
      ? communityRoleResult.rows[0].community_role_idx
      : null;

  const accessToken = setAccessToken(userIdx);
  const refreshToken = setRefreshToken(userIdx);

  await putRefreshToken(refreshToken, userIdx);

  // 응답 구성
  res.status(200).json({
    player_status: playerStatus,
    access_token: accessToken,
    refresh_token: refreshToken,
    user_idx: userIdx,
    profile_image: profileImage,
    team_idx: teamIdx,
    team_role_idx: teamRoleIdx,
    community_role_idx: communityRoleIdx,
  });
};

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

const signupLoginInfo = async (req, res, next) => {
  const { id, password, nickname } = req.body;

  const result = await client.query(signupLoginInfoSQL, [
    id,
    password,
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

const checkRefreshToken = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    throw customError(401, "refresh token이 없습니다.");
  }

  const result = await client.query(checkRefreshtokenSQL, [authorization]);
  if (result.rows.length == 0)
    throw customError(403, "잘못된 refresh token 토큰입니다.");

  const expiresAt = new Date(result.rows[0].expires_at); // expires_at 필드 가져오기
  const now = new Date(); // 현재 시간 가져오기

  if (now >= expiresAt) throw customError(401, "만료된 refresh token 입니다.");

  const userIdx = result.rows[0].idx;

  const accessToken = setAccessToken(userIdx);

  res.status(200).send({
    accesstoken: accessToken,
  });
};

const accountSoftDelete = async (req, res, next) => {
  const { idx } = req.decoded;

  const result = await client.query(softDeleteSQL, [idx]);

  res.status(200).send({
    message: "회원 탈퇴에 성공했습니다.",
  });
};

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

// 이미지 관련
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

function setAccessToken(userIdx) {
  const accessToken = jwt.sign(
    {
      idx: userIdx,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "2h",
    }
  );
  return accessToken;
}

function setRefreshToken(userIdx) {
  const refreshToken = crypto.randomBytes(64).toString("hex"); // 128 characters
  return refreshToken;
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

async function deleteRefreshToken(userIdx) {
  const result = await client.query(putRefreshTokenSQL, [null, null, userIdx]);
}

function validate(regex, value) {
  //js에서 함수 표현식은 호이스팅 되지 않기 때문에 함수 선언식으로 바꿈
  if (value == null) return null;
  if (!regex.test(value)) {
    throw customError(400, `형식이 올바르지 않습니다.`);
  }
  return value;
}

module.exports = {};
