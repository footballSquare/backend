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
  getDiscordSigninPage,
  checkCode,
  discordOauthSigninLogic,
  signinCheck,
  signinLogic,
  checkDuplicateId,
  checkDuplicateNickname,
  signupLoginInfo,
  signupPlayerInfo,
  checkRefreshToken,
  accountSoftDelete,
  getMyInfo,
  getUserInfo,
  checkPassword,
  updateUserInfo,
  updateProfileImage,
  smsSendMessage,
  smsVerify,
  searchId,
  checkUser,
  updatePassword,
} = require("./service");

router.get("/oauth/url/discord", getDiscordSigninPage);

router.get("/oauth/token/discord", checkCode, discordOauthSigninLogic);

router.post("/sms/send", checkRegInputs([regPhone], ["phone"]), smsSendMessage);
router.post("/sms/verify", checkRegInputs([regPhone], ["phone"]), smsVerify);

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

router.post(
  "/signup/playerinfo",
  checkTemporaryAccessToken,
  checkRegInputs(
    [regPhone, regNickname, regPlatform, regIdx, regDiscordTag, regIdx],
    [
      "phone",
      "nickname",
      "platform",
      "common_status_idx",
      "discord_tag",
      "match_position_idx",
    ]
  ),
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
  updateUserInfo
);

router.put(
  "/profileimage",
  multerMiddleware,
  checkLogin,
  s3UploaderOptional("account"),
  updateProfileImage
);

router.post("/search/id", checkRegInputs([regPhone], ["phone"]), searchId);

router.post("/check/user", checkRegInputs([regId], ["id"]), checkUser);

router.put(
  "/user/password",
  checkRegInputs([regId, regPw], ["id", "password"]),
  updatePassword
);

module.exports = router;
