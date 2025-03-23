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
  signinLogin,
  checkDuplicateId,
  checkDuplicateNickname,
  signupLoginInfo,
  signupPlayerInfo,
  checkRefreshToken,
  accountSoftDelete,
  getMyInfo,
  getUserInfo,
  updateUserInfo,
  updateProfileImage,
  uploadS3,
} = require("./service");
const { softDeleteSQL } = require("./sql");

router.get("/ouath/url/discord");

router.get("/ouath/token/discord");

router.get(
  "/signin",
  checkRegInputs([regId, regPw], ["id", "password"]),
  signinLogin
);

router.post("/check/id", checkRegInputs([regId], ["id"]), checkDuplicateId);

router.post(
  "/check/nickname",
  checkRegInputs([regNickname], ["nickname"]),
  checkDuplicateNickname
);

router.post(
  "/signup/logininfo",
  checkRegInputs([regId, regPw, regNickname], ["id", "password", "nickname"]),
  signupLoginInfo
);

router.post("/signup/playerinfo", signupPlayerInfo);

router.get("/accesstoken", checkRefreshToken);

router.delete("/user/delete", checkLogin, accountSoftDelete);

router.get("/info/me", checkLogin, getMyInfo);

router.get("/info/:userIdx", getUserInfo);

router.put("/user/update", checkLogin, updateUserInfo);

router.put(
  "/profileimage",
  checkLogin,
  uploadS3.single("image"),
  updateProfileImage
);

module.exports = router;
