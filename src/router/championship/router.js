const router = require("express").Router()

const {
    postChampionShipMatch
} = require("./service")

// 대회 매치 생성하기
router.post("/:championship_list_idx/championship_match",
    postChampionShipMatch
)

module.exports = router