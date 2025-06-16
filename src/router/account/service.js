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
  getUserImageSQL,
  updateProfileImageSQL,
  signinDiscordOauth,
  signupDiscordOauth,
  getUserIdxDiscordOauthSQL,
  updateUserInfoSQL,
  searchIdSQL,
  checkUserIdxSQL,
  updatePasswordSQL,
  checkDuplicatePhoneSQL,
} = require("./sql");

const { regMessage } = require("./../../constant/regx");

// Discord OAuth2===========================================================
const getDiscordSigninPage = (req, res, next) => {
  const { persistent, device_uuid } = req.body;

  let state

  // 지속 로그인 요청시, device_uuid 포함한 state 난수 생성
  if(persistent && device_uuid){
    const payload = {
      device_uuid,
      nonce: crypto.randomBytes(8).toString("hex") // CSRF 방지용 난수
    };

    state = Buffer.from(JSON.stringify(payload)).toString("base64");
  } else {
    // 기존 로그인 방식 유지
    state = crypto.randomBytes(16).toString("hex");
  }

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
    throw customError(400, "code가 존재하지 않음.");
  }

  try {
    const decodedState = JSON.parse(Buffer.from(state,"base64").toString())
    const { device_uuid, nonce } = decodedState;

    // redis 검증 필요할 수 도??

    req.oauth = {
      persistent: true,
      device_uuid,
    };
  } catch(e){
    req.oauth = {
      persistent: false,
      device_uuid: null,
    };
  }

  next();
};

// 디스코드 일반 로그인
const discordOauthSigninLogic = async (req, res, next) => {
  const { code } = req.query;
  const { persistent, device_uuid } = req.oauth;

  console.log("persistent는",persistent,"device_uuid는",device_uuid)

  const tokenResult = await axios.post(
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

  const { access_token, token_type } = tokenResult.data;

  const userResult = await axios.get("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `${token_type} ${access_token}`,
    },
  });

  const user = userResult.data;
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
    return;
  }

  const userIdx = result.rows[0].user_idx;

  const playerStatus = result.rows[0].player_status;

  if (playerStatus === "pending") {
    const accessTokenTemporary = setTemporaryAccessToken(userIdx);

    res.status(200).send({
      data: {
        player_status: playerStatus,
        user_idx: userIdx,
        access_token_temporary: accessTokenTemporary,
      },
    });
    return;
  } else if (playerStatus === "deleted") {
    throw customError(403, "이용 불가능한 계정입니다.");
  }

  const nickname = result.rows[0].nickname;
  const profileImage = result.rows[0].profile_image || null;
  const platform = result.rows[0].platform || null;
  const commonStatusIdx = result.rows[0].common_status_idx || null;
  const message = result.rows[0].message || null;
  const teamIdx = result.rows[0].team_idx || null;

  const teamRoleIdx = await getTeamRoleIdx(userIdx);
  const { community_role_idx, community_list_idx } = await getCommunityRoleIdx(
    userIdx
  );

  const accessToken = setAccessToken(
    userIdx,
    teamIdx,
    teamRoleIdx,
    community_role_idx,
    community_list_idx
  );


  if(persistent){
    const refreshToken = setRefreshToken();

    await putRefreshToken(refreshToken, userIdx, device_uuid);

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      domain: "footballsquare.co.kr",
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });
  }

  // 응답 구성
  res.status(200).send({
    data: {
      player_status: playerStatus,
      access_token: accessToken,
      user_idx: userIdx,
      nickname: nickname,
      platform: platform,
      common_status_idx: commonStatusIdx,
      message: message,
      discord_tag: discordTag,
      profile_image: profileImage,
      team_idx: teamIdx,
      team_role_idx: teamRoleIdx,
      community_role_idx: community_role_idx || null,
      community_list_idx: community_list_idx || null,
    },
  });
};

// 디스코드 지속 로그인
const persistentDiscordOauthSigninLogic = async (req, res, next) => {
  const { code, state } = req.query;

  const tokenResult = await axios.post(
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

  const { access_token, token_type } = tokenResult.data;

  const userResult = await axios.get("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `${token_type} ${access_token}`,
    },
  });

  const user = userResult.data;
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
    return;
  }

  const userIdx = result.rows[0].user_idx;

  const playerStatus = result.rows[0].player_status;

  if (playerStatus === "pending") {
    const accessTokenTemporary = setTemporaryAccessToken(userIdx);

    res.status(200).send({
      data: {
        player_status: playerStatus,
        user_idx: userIdx,
        access_token_temporary: accessTokenTemporary,
      },
    });
    return;
  } else if (playerStatus === "deleted") {
    throw customError(403, "이용 불가능한 계정입니다.");
  }

  const nickname = result.rows[0].nickname;
  const profileImage = result.rows[0].profile_image || null;
  const platform = result.rows[0].platform || null;
  const commonStatusIdx = result.rows[0].common_status_idx || null;
  const message = result.rows[0].message || null;
  const teamIdx = result.rows[0].team_idx || null;

  const teamRoleIdx = await getTeamRoleIdx(userIdx);
  const { community_role_idx, community_list_idx } = await getCommunityRoleIdx(
    userIdx
  );

  const accessToken = setAccessToken(
    userIdx,
    teamIdx,
    teamRoleIdx,
    community_role_idx,
    community_list_idx
  );

  // 마찬가지로 일단 RT 발급 로직 삭제

  // const refreshToken = setRefreshToken();

  // await putRefreshToken(refreshToken, userIdx);

  // res.cookie("refresh_token", refreshToken, {
  //   httpOnly: true,
  //   secure: true,
  //   sameSite: "None",
  //   domain: "footballsquare.co.kr",
  //   maxAge: 3 * 24 * 60 * 60 * 1000,
  // });

  // 응답 구성
  res.status(200).send({
    data: {
      player_status: playerStatus,
      access_token: accessToken,
      user_idx: userIdx,
      nickname: nickname,
      platform: platform,
      common_status_idx: commonStatusIdx,
      message: message,
      discord_tag: discordTag,
      profile_image: profileImage,
      team_idx: teamIdx,
      team_role_idx: teamRoleIdx,
      community_role_idx: community_role_idx || null,
      community_list_idx: community_list_idx || null,
    },
  });
};

// 로그인 및 토큰 =================================================================
const signinCheck = async (req, res, next) => {
  const { id, password } = req.body;

  const result = await client.query(checkUserPasswordSQL, [id]);

  if (result.rows.length === 0) {
    throw customError(404, "계정 정보를 확인해주십시오.");
  }

  const hashedPassword = result.rows[0].player_list_password;

  const isMatch = await bcrypt.compare(password, hashedPassword);

  if (!isMatch) {
    throw customError(404, "계정 정보를 확인해주십시오.");
  }

  next();
};


// 일반 로그인 서비스
const signinLogic = async (req, res, next) => {
  const { id, persistent, device_uuid } = req.body;

  const result = await client.query(signinSQL, [id]);

  const userIdx = result.rows[0].user_idx;

  const playerStatus = result.rows[0].player_status;

  // 아직 가입하지 않은 사용자 예외처리
  if (playerStatus === "pending") {
    const accessTokenTemporary = setTemporaryAccessToken(userIdx);

    res.status(200).send({
      data: {
        player_status: playerStatus,
        user_idx: userIdx,
        access_token_temporary: accessTokenTemporary,
      },
    });
    return;
  } else if (playerStatus === "deleted") {
    throw customError(403, "이용 불가능한 계정입니다.");
  }

  const nickname = result.rows[0].nickname;
  const profileImage = result.rows[0].profile_image || null;
  const platform = result.rows[0].platform || null;
  const commonStatusIdx = result.rows[0].common_status_idx || null;
  const message = result.rows[0].message || null;
  const discordTag = result.rows[0].discord_tag || null;
  const teamIdx = result.rows[0].team_idx || null;

  const teamRoleIdx = await getTeamRoleIdx(userIdx);
  const { community_role_idx, community_list_idx } = await getCommunityRoleIdx(
    userIdx
  );

  const accessToken = setAccessToken(
    userIdx,
    teamIdx,
    teamRoleIdx,
    community_role_idx,
    community_list_idx
  );

  // 일단 기존의 서비스는 RT를 발급하지 않도록 수정
  if(persistent && device_uuid){
    console.log(`
      리프레시 토큰이 발급되었습니다.
      persistent는 ${persistent}
      device_uuidx는 ${device_uuid}
      `)
    const refreshToken = setRefreshToken();

    await putRefreshToken(refreshToken, userIdx, device_uuid);

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      domain: ".footballsquare.co.kr",
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });
  }
  

  // 응답 구성
  res.status(200).send({
    data: {
      player_status: playerStatus,
      access_token: accessToken,
      user_idx: userIdx,
      nickname: nickname,
      platform: platform,
      common_status_idx: commonStatusIdx,
      message: message,
      discord_tag: discordTag,
      profile_image: profileImage,
      team_idx: teamIdx,
      team_role_idx: teamRoleIdx,
      community_role_idx: community_role_idx,
      community_list_idx: community_list_idx,
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
    // 만료된 토큰은 삭제
    await client.query(
    `DELETE FROM player.refreshtoken WHERE refreshtoken = $1`,
    [refreshToken]
  );
    throw customError(401, "만료된 refresh token 입니다.");
  }

  const userIdx = result.rows[0].user_idx;
  const teamIdx = result.rows[0].team_idx;
  const teamRoleIdx = await getTeamRoleIdx(userIdx);
  const { community_role_idx, community_list_idx } = await getCommunityRoleIdx(
    userIdx
  );

  const accessToken = setAccessToken(
    userIdx,
    teamIdx,
    teamRoleIdx,
    community_role_idx,
    community_list_idx
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

  if (result.rows.length === 0) {
    return {
      community_role_idx: null,
      community_list_idx: null,
    };
  }

  const { community_role_idx, community_list_idx } = result.rows[0];

  return { community_role_idx, community_list_idx };
}

// 리프레시 토큰 DB에 집어넣는 함수
async function putRefreshToken(refreshToken, userIdx, device_uuid) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 3);
  const putRefreshtoken = await client.query(putRefreshtokenSQL, [
    refreshToken,
    expiresAt,
    userIdx,
    device_uuid
  ]);
}

// 엑세스 토큰 발급 함수
function setAccessToken(
  userIdx,
  teamIdx,
  teamRoleIdx,
  communityRoleIdx,
  community_list_idx
) {
  const accessToken = jwt.sign(
    {
      my_player_list_idx: userIdx,
      my_team_list_idx: teamIdx ?? null,
      my_team_role_idx: teamRoleIdx ?? null,
      my_community_role_idx: communityRoleIdx ?? null,
      my_community_list_idx: community_list_idx ?? null,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "2h",
    }
  );
  return accessToken;
}

// 리프레시 토큰 생성 함수
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

  const accessTokenTemporary = setTemporaryAccessToken(userIdx);

  userIdxResult.rows[0].access_token_temporary = accessTokenTemporary;
  res.status(200).send({
    data: userIdxResult.rows[0],
  });
};
const signupSend = async (req, res, next) => {
  const { phone } = req.body;

  const sendCountKey = `count:${phone}`;
  let sendCount = await redisClient.get(sendCountKey);
  sendCount = parseInt(sendCount) || 0;

  if (sendCount >= process.env.MAX_SEND_COUNT)
    throw customError(429, "하루 전송 가능 횟수를 초과했습니다.");

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const data = { code, attempts: 0 };
  await redisClient.setEx(phone, process.env.CODE_EXPIRY, JSON.stringify(data));

  // Redis 발송 횟수 증가 및 만료시간 설정
  if (sendCount === 0) {
    // 처음 요청 시 expire 설정
    await redisClient.set(sendCountKey, 1, {
      EX: process.env.SEND_COUNT_EXPIRY,
    });
  } else {
    await redisClient.incr(sendCountKey);
  }

  const result = await aligo.sendSMS({
    sender: process.env.SMS_SENDER,
    receiver: phone,
    msg: `[footballsquare] 회원가입 인증번호는 [${code}] 입니다.`,
  });

  res.status(200).send({ message: "인증번호 전송 성공" });
};
const signupVerify = async (req, res, next) => {
  const { phone, code } = req.body;

  const record = await redisClient.get(phone);

  if (!record)
    throw customError(400, "인증번호가 만료되었거나 요청되지 않았습니다.");

  const parsedRecord = JSON.parse(record);

  if (parsedRecord.attempts >= process.env.MAX_ATTEMPTS) {
    await redisClient.del(phone);
    throw customError(429, "인증 시도 횟수를 초과했습니다.");
  }

  if (parsedRecord.code !== code) {
    parsedRecord.attempts += 1;
    await redisClient.setEx(
      phone,
      process.env.CODE_EXPIRY,
      JSON.stringify(parsedRecord)
    );
    throw customError(400, "인증번호가 일치하지 않습니다.");
  }
  next();
};
const signupCheckUser = async (req, res, next) => {
  const { phone } = req.body;

  const result = await client.query(checkDuplicatePhoneSQL, [phone]);

  const exists = result.rows[0]?.exists_flag;

  if (exists === undefined) {
    throw customError(500, "중복 확인 실패");
  }

  if (exists) {
    throw customError(409, "이미 회원가입된 유저입니다.");
  }
  next();
};
const signupPlayerInfo = async (req, res, next) => {
  const { phone } = req.body;

  const { my_player_list_idx } = req.decoded;
  const nickname = generate10DigitRandom(my_player_list_idx);
  const platform = "pc";
  const message = "잘 부탁드립니다!";
  const discord_tag = "footballsquare#001";
  const common_status_idx = 8;
  const match_position_idx = 0;

  const result = await client.query(signupPlayerInfoSQL, [
    phone,
    nickname,
    platform,
    common_status_idx,
    message,
    discord_tag,
    match_position_idx,
    my_player_list_idx,
  ]);

  res.status(200).send({
    message: "회원가입에 성공했습니다.",
  });
};
function setTemporaryAccessToken(userIdx) {
  const accessToken = jwt.sign(
    {
      my_player_list_idx: userIdx,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "10m",
    }
  );
  return accessToken;
}
function generate10DigitRandom(idx) {
  const now = Date.now(); // 밀리초 기준 timestamp
  const baseString = `${idx}-${now}`;

  // SHA256 해시 생성
  const hash = crypto.createHash("sha256").update(baseString).digest("hex");

  // 해시 문자열에서 앞부분 숫자 추출
  const numericHash = parseInt(hash.slice(0, 12), 16); // 16진수 → 10진수
  const tenDigit = numericHash.toString().slice(0, 10); // 앞 10자리만 사용

  return tenDigit;
}
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

  if (result.rows.length === 0)
    throw customError(404, "등록되지 않은 유저입니다.");

  res.status(200).send({
    data: result.rows[0],
  });
};

const getUserInfo = async (req, res, next) => {
  const { userIdx } = req.params;
  const { authorization } = req.headers;
  let isMine = false;

  if (authorization) {
    try{
        const { my_player_list_idx } = jwt.verify(
          authorization,
          process.env.ACCESS_TOKEN_SECRET
        );
        if (userIdx == my_player_list_idx) isMine = true;
      } catch (e) {
        if (e.name === "TokenExpiredError") {
          e.status = 401;
          e.message = "만료된 access token 입니다.";
        } else if (e.name === "JsonWebTokenError") {
          e.status = 403;
          e.message = "잘못된 access token 입니다.";
        }
        next(e);
      }
    }

  const result = await client.query(getUserInfoSQL, [userIdx]);

  if (result.rows.length === 0) {
    throw customError(404, "등록되지 않은 유저입니다.");
  }
  const trophyResult = await client.query(getUserAwardInfoSQL, [userIdx]);

  result.rows[0].is_mine = isMine;

  result.rows[0].Awards = trophyResult.rows;

  res.status(200).send({
    data: result.rows[0],
  });
};

// 비밀번호 체크 ======================================================================
const checkPassword = async (req, res, next) => {
  const { password } = req.body;
  const { my_player_list_idx } = req.decoded;

  const result = await client.query(checkPasswordSQL, [my_player_list_idx]);
  if (result.rows.length === 0)
    throw customError(404, "등록되지 않은 유저입니다.");

  const hashedPassword = result.rows[0].player_list_password;

  const isMatch = await bcrypt.compare(password, hashedPassword);

  if (!isMatch) throw customError(401, "비밀번호가 틀렸습니다.");

  res.status(200).send({
    message: "비밀번호 인증에 성공했습니다.",
  });
};
// 회원 정보 업데이트 =================================================================
const updateUserInfo = async (req, res, next) => {
  const { my_player_list_idx } = req.decoded;
  const {
    nickname,
    platform,
    common_status_idx,
    message,
    discord_tag,
    match_position_idx,
  } = req.body;

  const userMessage = message ?? null;

  const result = await client.query(updateUserInfoSQL, [
    nickname,
    platform,
    common_status_idx,
    userMessage,
    discord_tag,
    match_position_idx,
    my_player_list_idx,
  ]);

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
// sms 관련
const redisClient = require("../../database/redisClient");
const { env } = require("process");
const smsSendMessage = async (req, res, next) => {
  const { phone } = req.body;

  const sendCountKey = `count:${phone}`;
  let sendCount = await redisClient.get(sendCountKey);
  sendCount = parseInt(sendCount) || 0;

  if (sendCount >= process.env.MAX_SEND_COUNT)
    throw customError(429, "하루 전송 가능 횟수를 초과했습니다.");

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

  res.status(200).send({ message: "인증번호 전송 성공" });
};
const smsVerify = async (req, res, next) => {
  const { phone, code } = req.body;

  const record = await redisClient.get(phone);

  if (!record)
    throw customError(400, "인증번호가 만료되었거나 요청되지 않았습니다.");

  const parsedRecord = JSON.parse(record);

  if (parsedRecord.attempts >= MAX_ATTEMPTS) {
    await redisClient.del(phone);
    throw customError(429, "인증 시도 횟수를 초과했습니다.");
  }

  if (parsedRecord.code !== code) {
    parsedRecord.attempts += 1;
    await redisClient.setEx(phone, CODE_EXPIRY, JSON.stringify(parsedRecord));
    throw customError(400, "인증번호가 일치하지 않습니다.");
  }

  // 인증 성공
  await redisClient.del(phone);
  return res.status(200).send({ message: "인증 성공" });
};
// id, password 찾기
const searchIdSend = async (req, res, next) => {
  const { phone } = req.body;

  const sendCountKey = `count:${phone}`;
  let sendCount = await redisClient.get(sendCountKey);
  sendCount = parseInt(sendCount) || 0;

  if (sendCount >= process.env.MAX_SEND_COUNT)
    throw customError(429, "하루 전송 가능 횟수를 초과했습니다.");

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const data = { code, attempts: 0 };
  await redisClient.setEx(phone, process.env.CODE_EXPIRY, JSON.stringify(data));

  // Redis 발송 횟수 증가 및 만료시간 설정
  if (sendCount === 0) {
    // 처음 요청 시 expire 설정
    await redisClient.set(sendCountKey, 1, {
      EX: process.env.SEND_COUNT_EXPIRY,
    });
  } else {
    await redisClient.incr(sendCountKey);
  }

  const result = await aligo.sendSMS({
    sender: process.env.SMS_SENDER,
    receiver: phone,
    msg: `[footballsquare] 아이디찾기 인증번호는 [${code}] 입니다.`,
  });

  res.status(200).send({ message: "인증번호 전송 성공" });
};
const searchIdVerify = async (req, res, next) => {
  const { phone, code } = req.body;

  const record = await redisClient.get(phone);

  if (!record)
    throw customError(400, "인증번호가 만료되었거나 요청되지 않았습니다.");

  const parsedRecord = JSON.parse(record);

  if (parsedRecord.attempts >= process.env.MAX_ATTEMPTS) {
    await redisClient.del(phone);
    throw customError(429, "인증 시도 횟수를 초과했습니다.");
  }

  if (parsedRecord.code !== code) {
    parsedRecord.attempts += 1;
    await redisClient.setEx(
      phone,
      process.env.CODE_EXPIRY,
      JSON.stringify(parsedRecord)
    );
    throw customError(400, "인증번호가 일치하지 않습니다.");
  }
  next();
};
const searchId = async (req, res, next) => {
  const { phone } = req.body;
  const result = await client.query(searchIdSQL, [phone]);

  if (result.rows.length === 0)
    throw customError(404, "등록되지 않은 유저입니다.");

  res.status(200).send({
    data: result.rows[0],
  });
};
const searchPwSend = async (req, res, next) => {
  const { phone } = req.body;

  const sendCountKey = `count:${phone}`;
  let sendCount = await redisClient.get(sendCountKey);
  sendCount = parseInt(sendCount) || 0;

  if (sendCount >= process.env.MAX_SEND_COUNT)
    throw customError(429, "하루 전송 가능 횟수를 초과했습니다.");

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const data = { code, attempts: 0 };
  await redisClient.setEx(phone, process.env.CODE_EXPIRY, JSON.stringify(data));

  // Redis 발송 횟수 증가 및 만료시간 설정
  if (sendCount === 0) {
    // 처음 요청 시 expire 설정
    await redisClient.set(sendCountKey, 1, {
      EX: process.env.SEND_COUNT_EXPIRY,
    });
  } else {
    await redisClient.incr(sendCountKey);
  }

  const result = await aligo.sendSMS({
    sender: process.env.SMS_SENDER,
    receiver: phone,
    msg: `[footballsquare] 비밀번호찾기 인증번호는 [${code}] 입니다.`,
  });

  res.status(200).send({ message: "인증번호 전송 성공" });
};
const searchPwVerify = async (req, res, next) => {
  const { phone, code } = req.body;

  const record = await redisClient.get(phone);

  if (!record)
    throw customError(400, "인증번호가 만료되었거나 요청되지 않았습니다.");

  const parsedRecord = JSON.parse(record);

  if (parsedRecord.attempts >= process.env.MAX_ATTEMPTS) {
    await redisClient.del(phone);
    throw customError(429, "인증 시도 횟수를 초과했습니다.");
  }

  if (parsedRecord.code !== code) {
    parsedRecord.attempts += 1;
    await redisClient.setEx(
      phone,
      process.env.CODE_EXPIRY,
      JSON.stringify(parsedRecord)
    );
    throw customError(400, "인증번호가 일치하지 않습니다.");
  }
  next();
};
const checkUser = async (req, res, next) => {
  const { phone } = req.body;
  const result = await client.query(checkUserIdxSQL, [phone]);

  if (result.rows.length === 0)
    throw customError(404, "등록되지 않은 유저입니다.");
  if (!result.rows[0].id) throw customError(404, "등록되지 않은 유저입니다.");

  const userIdx = result.rows[0].user_idx;
  const accessTokenTemporary = setTemporaryAccessToken(userIdx);

  const data = { access_token_temporary: accessTokenTemporary };

  res.status(200).send({
    data: data,
  });
};
const updatePassword = async (req, res, next) => {
  const { my_player_list_idx } = req.decoded;
  const { password } = req.body;
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const result = await client.query(updatePasswordSQL, [
    hashedPassword,
    my_player_list_idx,
  ]);
  res.status(200).send({
    message: "비밀번호 변경 성공",
  });
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

module.exports = {
  getDiscordSigninPage: trycatchWrapper(getDiscordSigninPage),
  checkCode: trycatchWrapper(checkCode),
  discordOauthSigninLogic: trycatchWrapper(discordOauthSigninLogic),
  signinCheck: trycatchWrapper(signinCheck),
  signinLogic: trycatchWrapper(signinLogic),
  checkDuplicateId: trycatchWrapper(checkDuplicateId),
  checkDuplicateNickname: trycatchWrapper(checkDuplicateNickname),
  signupLoginInfo: trycatchWrapper(signupLoginInfo),
  signupSend: trycatchWrapper(signupSend),
  signupVerify: trycatchWrapper(signupVerify),
  signupCheckUser: trycatchWrapper(signupCheckUser),
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
  searchIdSend: trycatchWrapper(searchIdSend),
  searchIdVerify: trycatchWrapper(searchIdVerify),
  searchId: trycatchWrapper(searchId),
  searchPwSend: trycatchWrapper(searchPwSend),
  searchPwVerify: trycatchWrapper(searchPwVerify),
  checkUser: trycatchWrapper(checkUser),
  updatePassword: trycatchWrapper(updatePassword),
};
