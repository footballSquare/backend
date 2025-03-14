const router = require("express").Router()

const {
    postChampionShipMatch,
    getChampionShipParticipationTeam,
    getChampionShipData,
    getChampionShipMatchList,
    fetchChampionShipMatch,
    fetchEvidanceImg
} = require("./service")

// 대회 매치 생성하기
router.post("/:championship_list_idx/championship_match",
    postChampionShipMatch
)

// 대회 매치 증빙자료 가져오기
router.get("/championship_match/:championship_match_idx/evidance_img",
    fetchEvidanceImg
)

// 대회 정보 가져오기
router.get("/:championship_list_idx",
    getChampionShipData
)

// 대회 참여 팀 가져오기
router.get("/:championship_list_idx/participation_team",
    getChampionShipParticipationTeam
)

// 대회 매치 목록 가져오기
router.get("/:championship_list_idx/championship_match",
    getChampionShipMatchList
)

// 대회 매치 세부 정보 가져오기
router.get("/championship_match/:championship_match_idx/detail",
    fetchChampionShipMatch
)

module.exports = router