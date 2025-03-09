const MATCH_PARTICIPATION_TYPE = {
    APPROVAL_REQUIRED: 0,  // 승인 참여
    OPEN_TO_ALL: 1        // 아무나 참여 가능
};

const MATCH_ATTRIBUTE = {
    PUBLIC: 0,   // 공개
    PRIVATE: 1,  // 비공개
    CHAMPIONSHIP: 2 // 대회
};

module.exports = { MATCH_PARTICIPATION_TYPE, MATCH_ATTRIBUTE };
