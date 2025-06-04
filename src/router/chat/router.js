const router = require("express").Router()

const { 
    checkLogin
} = require("../../middleware/checkLogin")

const {
    getTeamChat
} = require("./service")

// 팀 채팅 기록 가져오기
router.get("/team",
    checkLogin,
    getTeamChat
)


module.exports = router