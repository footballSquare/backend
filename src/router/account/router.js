const router = require("express").Router();

const trycatchWrapper = require("./../../util/trycatchWrapper");

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

const { checkRegInput } = require("./../../middleware/checkInput");

router.get(
  "/ouath/url/discord",
  trycatchWrapper((req, res, next) => {})
);

router.get(
  "/ouath/token/discord",
  trycatchWrapper((req, res, next) => {})
);

router.get(
  "/signin",
  trycatchWrapper((req, res, next) => {})
);

router.post(
  "/check/id",
  trycatchWrapper((req, res, next) => {
    checkRegInput(regId, ["id"]);
  })
);

router.post(
  "/check/nickname",
  trycatchWrapper((req, res, next) => {})
);

router.post(
  "/signup/logininfo",
  trycatchWrapper((req, res, next) => {})
);

router.post(
  "/signup/playerinfo",
  trycatchWrapper((req, res, next) => {})
);

router.get(
  "/accesstoken",
  trycatchWrapper((req, res, next) => {})
);

router.delete(
  "/user/delete",
  trycatchWrapper((req, res, next) => {})
);

router.get(
  "/info/me",
  trycatchWrapper((req, res, next) => {})
);

router.get(
  "/info/:userIdx",
  trycatchWrapper((req, res, next) => {})
);

router.put(
  "/user/update",
  trycatchWrapper((req, res, next) => {})
);

router.put(
  "/profileimage",
  trycatchWrapper((req, res, next) => {})
);

module.exports = router;
