const CHAMPIONSHIP_TYPE = {
    LEAGUE: 0,           // 리그
    TOURNAMENT_16: 1,    // 토너먼트 16강
    TOURNAMENT_8: 2,     // 토너먼트 8강
    TOURNAMENT_4: 3      // 토너먼트 4강
};

const CHAMPIONSHIP_STATUS = {
    ONGOING: 3,         // 대회 진행 중
    ENDED: 4            // 대회 종료
};

module.exports = { CHAMPIONSHIP_TYPE, CHAMPIONSHIP_STATUS };
