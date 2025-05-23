const router = require("express").Router();

const {
  regPhone,
  regIdx,
  regId,
  regPw,
  regNickname,
  regPlatform,
  regDiscordTag,
} = require("./../../constant/regx");

const { checkRegInputs } = require("./../../middleware/checkInput");

const { checkLogin } = require("./../../middleware/checkLogin");

const checkTemporaryAccessToken = require("./../../middleware/checkTemporaryAccessToken");

const {
  multerMiddleware,
} = require("../../database/s3Config/multerMiddleware");

const { s3UploaderOptional } = require("../../middleware/s3UpLoader");

const {
  checkNicknameDuplicate
} = require("../../middleware/checkDuplicate")

const {
  getDiscordSigninPage,
  checkCode,
  discordOauthSigninLogic,
  signinCheck,
  signinLogic,
  checkDuplicateId,
  checkDuplicateNickname,
  signupLoginInfo,
  signupSend,
  signupVerify,
  signupCheckUser,
  signupPlayerInfo,
  checkRefreshToken,
  accountSoftDelete,
  getMyInfo,
  getUserInfo,
  checkPassword,
  updateUserInfo,
  updateProfileImage,
  searchId,
  checkUser,
  updatePassword,
  searchIdSend,
  searchIdVerify,
  searchPwSend,
  searchPwVerify,
} = require("./service");

router.get("/oauth/url/discord", getDiscordSigninPage);

router.get("/oauth/token/discord", checkCode, discordOauthSigninLogic);

router.post(
  "/signin",
  checkRegInputs([regId, regPw], ["id", "password"]),
  signinCheck,
  signinLogic
);

router.post("/check/id", checkRegInputs([regId], ["id"]), checkDuplicateId);

router.post(
  "/check/nickname",
  checkRegInputs([regNickname], ["nickname"]),
  checkDuplicateNickname
);

router.post(
  "/signup/logininfo",
  checkRegInputs([regId, regPw], ["id", "password"]),
  signupLoginInfo
);

// 휴대폰 인증번호 요청하기
router.post(
  "/sms/signup/send",
  checkRegInputs([regPhone], ["phone"]),
  signupCheckUser,
  signupSend
);

router.post(
  "/sms/signup/verify",
  checkTemporaryAccessToken,
  checkRegInputs([regPhone], ["phone"]),
  signupVerify,
  signupCheckUser,
  signupPlayerInfo
);

router.get("/accesstoken", checkRefreshToken);

router.delete("/user/delete", checkLogin, accountSoftDelete);

router.get("/myinfo", checkLogin, getMyInfo);

router.get(
  "/info/:userIdx",
  checkRegInputs([regIdx], ["userIdx"]),
  getUserInfo
);

router.post(
  "/check/password",
  checkLogin,
  checkRegInputs([regPw], ["password"]),
  checkPassword
);

// 나의 정보 수정하기
router.put(
  "/user/update",
  checkLogin,
  checkRegInputs(
    [regNickname, regPlatform, regIdx, regDiscordTag, regIdx],
    [
      "nickname",
      "platform",
      "common_status_idx",
      "discord_tag",
      "match_position_idx",
    ]
  ),
  checkNicknameDuplicate(),
  updateUserInfo
);

router.put(
  "/profileimage",
  multerMiddleware,
  checkLogin,
  s3UploaderOptional("account"),
  updateProfileImage
);

router.post(
  "/sms/search_id/send",
  checkRegInputs([regPhone], ["phone"]),
  searchIdSend
);

router.post(
  "/sms/search_id/verify",
  checkRegInputs([regPhone], ["phone"]),
  searchIdVerify,
  searchId
);

router.post(
  "/sms/search_pw/send",
  checkRegInputs([regPhone], ["phone"]),
  searchPwSend
);

// 비밀번호 인증번호 검증
router.post(
  "/sms/search_pw/verify",
  checkRegInputs([regPhone], ["phone"]),
  searchPwVerify,
  checkUser
);

router.put(
  "/user/password",
  checkTemporaryAccessToken,
  checkRegInputs([regPw], ["password"]),
  updatePassword
);

module.exports = router;
