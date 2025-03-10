const COMMON_STATUS = {
    MATCH_LINEUP_OPEN: 0,  // 매치 라인업 마감 전
    MATCH_LINEUP_CLOSED: 1,  // 매치 라인업 마감
    MATCH_STATS_CLOSED: 2,  // 매치 스탯 입력 마감
    TEAM_RECRUITING: 5,  // 팀원 모집 중
    LOOKING_FOR_TEAM: 6,  // 팀 구하는 중
    OPEN_MATCH_PARTICIPATION: 7,  // 공방 매치 참여 희망
    NO_STATUS: 8  // 무상태
};

module.exports = { COMMON_STATUS };
