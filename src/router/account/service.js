const client = require("../../database/postgreSQL");
const customError = require("../../util/customError");
const trycatchWrapper = require("./../../util/trycatchWrapper");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const axios = require("axios");
const aligo = require("./../../util/aligo_sms");

const { deleteFileFromS3 } = require("../../database/s3Config/s3Deleter");

const {
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
  getUserAwardInfoSQL,
  checkPasswordSQL,
  updateUserInfoSQL,
  getUserImageSQL,
  updateProfileImageSQL,
  signinDiscordOauth,
  signupDiscordOauth,
  getUserIdxDiscordOauthSQL,
  checkUserSQL,
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

// Discord OAuth2===========================================================
const getDiscordSigninPage = (req, res, next) => {
  const state = crypto.randomBytes(16).toString("hex"); // CSRF 방지용 상태값
  const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${
    process.env.DISCORD_CLIENT_ID
  }&permissions=0&response_type=code&redirect_uri=${encodeURIComponent(
    process.env.DISCORD_REDIRECT_URI
  )}&state=${state}&scope=identify`;
  res.status(200).send({
    data: {
      url: discordAuthUrl,
    },
  });
};
const checkCode = async (req, res, next) => {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).send({ message: "code가 존재하지 않음." });
  }

  next();
};
const discordOauthSigninLogic = async (req, res, next) => {
  const { code, state } = req.query;

  const tokenRes = await axios.post(
    "https://discord.com/api/oauth2/token",
    new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.DISCORD_REDIRECT_URI,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  const { access_token, token_type } = tokenRes.data;

  const userRes = await axios.get("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `${token_type} ${access_token}`,
    },
  });

  const user = userRes.data;
  const discordTag = `${user.username}#${user.discriminator}`;

  const result = await client.query(signinDiscordOauth, [user.id]);

  if (result.rows.length === 0) {
    const signupResult = await client.query(signupDiscordOauth, [
      user.id,
      discordTag,
    ]);
    
    const result = await client.query(getUserIdxDiscordOauthSQL, [user.id]);

    res.status(200).send({
      data: result.rows[0],
    });
  }

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
  } else if (playerStatus === "deleted") {
    res.status(403).send({
      message: "이용 불가능한 계정입니다.",
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
    secure: true, 
    sameSite: "None",
    maxAge: 3 * 24 * 60 * 60 * 1000,
  });

  // 응답 구성
  res.status(200).send({
    data: {
      player_status: playerStatus,
      access_token: accessToken,
      user_idx: userIdx,
      profile_image: profileImage,
      team_idx: teamIdx,
      team_role_idx: teamRoleIdx,
      community_role_idx: communityRoleIdx,
    },
  });
};
// 로그인 및 토큰 =================================================================
const signinCheck = async (req, res, next) => {
  const { id, password } = req.body;

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

// 로그인 서비스
const signinLogic = async (req, res, next) => {
  const { id } = req.body;

  const result = await client.query(signinSQL, [id]);

  const userIdx = result.rows[0].user_idx;

  const playerStatus = result.rows[0].player_status;

  // 아직 가입하지 않은 사용자 예외처리
  if (playerStatus === "pending") {
    res.status(200).send({
      data: {
        player_status: playerStatus,
        user_idx: userIdx,
      },
    });
    return;
  } else if (playerStatus === "deleted") {
    res.status(403).send({
      message: "이용 불가능한 계정입니다.",
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
    secure: true, 
    sameSite: "None",
    maxAge: 3 * 24 * 60 * 60 * 1000,
  });

  // 응답 구성
  res.status(200).send({
    data: {
      player_status: playerStatus,
      access_token: accessToken,
      user_idx: userIdx,
      profile_image: profileImage,
      team_idx: teamIdx,
      team_role_idx: teamRoleIdx,
      community_role_idx: communityRoleIdx,
    },
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
    data: {
      access_token: accessToken,
    },
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
  const { id, password } = req.body;

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const result = await client.query(signupLoginInfoSQL, [id, hashedPassword]);

  const userIdxResult = await client.query(getUserIdxSQL, [id]);
  const userIdx = userIdxResult.rows[0]?.user_idx;

  if (!userIdx) {
    throw customError(500, "user_idx 조회 실패");
  }
  res.status(200).send({
    data: userIdxResult.rows[0],
  });
};

const signupPlayerInfo = async (req, res, next) => {
  let { user_idx, nickname, team_idx, platform, state, message, discord_tag } =
    req.body;

  if (!user_idx) {
    throw customError(400, "user_idx는 필수값입니다.");
  }
  if (!nickname) {
    throw customError(400, "nickname은 필수값입니다.");
  }

  team_idx = validate(regIdx, team_idx);
  nickname = validate(regNickname, nickname);
  platform = validate(regPlatform, platform);
  state = validate(regState, state);
  message = validate(regMessage, message);
  discord_tag = validate(regDiscordTag, discord_tag);

  const checkUserResult = await client.query(checkUserSQL, [user_idx]);

  const exists = checkUserResult.rows[0]?.exists_flag;

  if (exists === undefined) {
    throw customError(500, "중복 확인 실패");
  }

  if (!exists) {
    throw customError(404, "존재하지 않는 유저입니다.");
  }

  const result = await client.query(signupPlayerInfoSQL, [
    team_idx,
    nickname,
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

// 회원 삭제(soft delete) =================================================================
const accountSoftDelete = async (req, res, next) => {
  const { my_player_list_idx } = req.decoded;

  const result = await client.query(softDeleteSQL, [my_player_list_idx]);

  res.status(200).send({
    message: "회원 탈퇴에 성공했습니다.",
  });
};

// 회원 정보 가져오기 =================================================================
const getMyInfo = async (req, res, next) => {
  const { my_player_list_idx } = req.decoded;
  const result = await client.query(getMyInfoSQL, [my_player_list_idx]);

  if (result.rows.length === 0) {
    throw customError(404, "등록되지 않은 유저입니다.");
  }
  res.status(200).send({
    data: result.rows[0],
  });
};

const getUserInfo = async (req, res, next) => {
  const { userIdx } = req.params;
  console.log(userIdx);
  const { authorization } = req.headers;
  let isMine = false;

  if (authorization) {
    const { my_player_list_idx } = jwt.verify(
      authorization,
      process.env.ACCESS_TOKEN_SECRET
    );
    if (userIdx == my_player_list_idx) isMine = true;
  }

  const result = await client.query(getUserInfoSQL, [userIdx]);

  if (result.rows.length === 0) {
    throw customError(404, "등록되지 않은 유저입니다.");
  }
  const trophyResult = await client.query(getUserAwardInfoSQL,[userIdx]);

  result.rows[0].is_mine = isMine;

  result.rows[0].Awards = trophyResult.rows

  res.status(200).send({
    data: result.rows[0],
  });
};

// 비밀번호 체크 ======================================================================
const checkPassword = async (req, res, next) => {
  const { password } = req.body;
  const { my_player_list_idx } = req.decoded;

  const result = await client.query(checkPasswordSQL, [my_player_list_idx]);
  if (result.rows.length === 0) {
    throw customError(404, "등록되지 않은 유저입니다.");
  }

  const hashedPassword = result.rows[0].player_list_password;

  const isMatch = await bcrypt.compare(password, hashedPassword);

  if (!isMatch) {
    throw customError(401, "비밀번호가 틀렸습니다.");
  }

  res.status(200).send({
    message: "비밀번호 인증에 성공했습니다.",
  });
};
// 회원 정보 업데이트 =================================================================
const updateUserInfo = async (req, res, next) => {
  const { my_player_list_idx } = req.decoded;
  const {
    id,
    password,
    nickname,
    platform,
    state,
    message,
    discord_tag,
  } = req.body;

  let hashedPassword = null;
  if (password && validate(regPw, password) !== null) {
    const saltRounds = 10;
    hashedPassword = await bcrypt.hash(password, saltRounds);
  }

  // 필드별 정규식 검증
  const fields = {
    player_list_id: validate(regId, id),
    player_list_password: hashedPassword,
    player_list_nickname: validate(regNickname, nickname),
    player_list_platform: validate(regPlatform, platform),
    player_list_state: validate(regState, state),
    player_list_message: validate(regMessage, message),
    player_list_discord_tag: validate(regDiscordTag, discord_tag),
  };

  // null이 아닌 값들만 추려서 SET 구문 생성
  const setClauses = [];
  const values = [];
  let idx = 1;

  for (const [key, value] of Object.entries(fields)) {
    if (value !== null) {
      setClauses.push(`${key} = $${idx++}`);
      values.push(value);
    }
  }

  if (setClauses.length === 0) {
    return res.status(400).send({ message: "업데이트할 정보가 없습니다." });
  }

  // 마지막에 player_list_idx 조건 추가
  values.push(my_player_list_idx);
  const query = `
    UPDATE player.list
    SET ${setClauses.join(", ")}
    WHERE player_list_idx = $${idx}
  `;

  await client.query(query, values);

  res.status(200).send({
    message: "정보 수정 성공했습니다.",
  });
};

// 이미지 관련 =================================================================
const updateProfileImage = async (req, res, next) => {
  const { my_player_list_idx } = req.decoded;
  const new_img_url = req.fileUrl;

  console.log("new_img_url", new_img_url);
  console.log("my_player_list_idx", my_player_list_idx);
  const { rows } = await client.query(getUserImageSQL, [my_player_list_idx]);

  const old_profileImg_url = rows[0].profile_image;

  if (old_profileImg_url) {
    await deleteFileFromS3(old_profileImg_url);
  }

  const result = await client.query(updateProfileImageSQL, [
    new_img_url,
    my_player_list_idx,
  ]);

  res.status(200).send({ message: "이미지 수정 성공" });
};

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

// sms 관련
const redisClient = require("../../database/redisClient");
const { env } = require("process");
const PHONE_REGEX = /^01[016789]\d{7,8}$/;
const CODE_EXPIRY = 180;
const MAX_ATTEMPTS = 5; // 시도 제한 횟수
const MAX_SEND_COUNT = 5; // 하루 전송 제한 횟수
const SEND_COUNT_EXPIRY = 60 * 60 * 24; // 전송 제한 횟수 초기화화

const smsSendMessage = async (req, res, next) => {
  const { phone } = req.body;
  if (!phone || !PHONE_REGEX.test(phone)) {
    return res
      .status(400)
      .json({ message: "휴대폰 번호의 제약조건이 맞지 않습니다." });
  }

  const sendCountKey = `count:${phone}`;
  let sendCount = await redisClient.get(sendCountKey);
  sendCount = parseInt(sendCount) || 0;

  if (sendCount >= MAX_SEND_COUNT) {
    return res
      .status(429)
      .json({ message: "하루 전송 가능 횟수를 초과했습니다." });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const data = { code, attempts: 0 };
  await redisClient.setEx(phone, CODE_EXPIRY, JSON.stringify(data));

  // Redis 발송 횟수 증가 및 만료시간 설정
  if (sendCount === 0) {
    // 처음 요청 시 expire 설정
    await redisClient.set(sendCountKey, 1, { EX: SEND_COUNT_EXPIRY });
  } else {
    await redisClient.incr(sendCountKey);
  }

  const result = await aligo.sendSMS({
    sender: process.env.SMS_SENDER,
    receiver: phone,
    msg: `[footballsquare] 인증번호는 [${code}] 입니다.`,
  });

  res.status(200).send({ code: code, message: "인증번호 전송 성공" });
};

const smsVerify = async (req, res, next) => {
  const { phone, code } = req.body;

  const record = await redisClient.get(phone);

  if (!record) {
    return res
      .status(400)
      .send({ message: "인증번호가 만료되었거나 요청되지 않았습니다." });
  }

  const parsedRecord = JSON.parse(record);

  if (parsedRecord.attempts >= MAX_ATTEMPTS) {
    await redisClient.del(phone);
    return res.status(429).send({ message: "인증 시도 횟수를 초과했습니다." });
  }

  if (parsedRecord.code !== code) {
    parsedRecord.attempts += 1;
    await redisClient.setEx(phone, CODE_EXPIRY, JSON.stringify(parsedRecord));

    return res.status(400).send({ message: "인증번호가 일치하지 않습니다." });
  }

  // 인증 성공
  await redisClient.del(phone);
  return res.status(200).send({ message: "인증 성공" });
};

// 많이 사용하는 기능은 함수 선언식 사용해서 저장 (미들웨어화하기기)
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
  getDiscordSigninPage: trycatchWrapper(getDiscordSigninPage),
  checkCode: trycatchWrapper(checkCode),
  discordOauthSigninLogic: trycatchWrapper(discordOauthSigninLogic),
  signinCheck: trycatchWrapper(signinCheck),
  signinLogic: trycatchWrapper(signinLogic),
  checkDuplicateId: trycatchWrapper(checkDuplicateId),
  checkDuplicateNickname: trycatchWrapper(checkDuplicateNickname),
  signupLoginInfo: trycatchWrapper(signupLoginInfo),
  signupPlayerInfo: trycatchWrapper(signupPlayerInfo),
  checkRefreshToken: trycatchWrapper(checkRefreshToken),
  accountSoftDelete: trycatchWrapper(accountSoftDelete),
  getMyInfo: trycatchWrapper(getMyInfo),
  getUserInfo: trycatchWrapper(getUserInfo),
  checkPassword: trycatchWrapper(checkPassword),
  updateUserInfo: trycatchWrapper(updateUserInfo),
  updateProfileImage: trycatchWrapper(updateProfileImage),
  smsSendMessage: trycatchWrapper(smsSendMessage),
  smsVerify: trycatchWrapper(smsVerify),
  uploadS3,
};
