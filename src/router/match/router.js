const router = require("express").Router()
const {getOpenMatchData} = require("./service")

router.get('/', (req, res) => {
    res.json({ message: "공개 매치 리스트" });
});

// 공개 매치 가져오기
router.get("/open",
    getOpenMatchData
)

module.exports = router