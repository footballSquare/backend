const router = require("express").Router();

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

const { checkRegInputs } = require("./../../middleware/checkInput");

const { checkLogin, optionalLogin } = require("./../../middleware/checkLogin");

const {
  multerMiddleware,
} = require("../../database/s3Config/multerMiddleware");

const { 
  s3Uploader,
  s3UploaderOptional
 } = require("../../middleware/s3UpLoader");

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
  uploadS3,
} = require("./service");

router.get("/oauth/url/discord", getDiscordSigninPage);

router.get("/oauth/token/discord", checkCode, discordOauthSigninLogic);

router.get(
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

router.post("/signup/playerinfo", signupPlayerInfo);

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

router.put("/user/update", checkLogin, updateUserInfo);

router.put(
  "/profileimage",
  multerMiddleware,
  checkLogin,
  s3UploaderOptional("account"),
  updateProfileImage
);

module.exports = router;
