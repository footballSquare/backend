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

router.post("/check/user", checkRegInputs([regId], ["id"]), checkUser);

router.put(
  "/user/password",
  checkRegInputs([regId, regPw], ["id", "password"]),
  updatePassword
);

module.exports = router;
