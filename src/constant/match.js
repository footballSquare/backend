const MATCH_PARTICIPATION_TYPE = {
    APPROVAL_REQUIRED: 0,  // 승인 참여
    OPEN_TO_ALL: 1        // 아무나 참여 가능
};

const MATCH_ATTRIBUTE = {
    PUBLIC: 0,   // 공개
    PRIVATE: 1,  // 비공개
    CHAMPIONSHIP: 2 // 대회
};

const MATCH_TYPE = {
    FULL: 0,    // 11:11
    RUSH: 1     // 4:4 
}

const MATCH_FORMATION = {
    433: 0,
    442: 1,
    4231: 2,
    343: 3,
    325: 4
}

const MATCH_POSITION = {
    GK: 0,
    RB: 1,
    RCB: 2,
    CB: 3,
    LCB: 4,
    LB: 5,
    RWB: 6,
    RDM: 7,
    CDM: 8,
    LDM: 9,
    LWB: 10,
    RM: 11,
    RCM: 12,
    CM: 13,
    LCM: 14,
    LM: 15,
    RAM: 16,
    CAM: 17,
    LAM: 18,
    RW: 19,
    RS: 20,
    ST: 21,
    LS: 22,
    LW: 23
};


const MATCH_DURATION = {
    HALF_HOUR: "30 minutes",
    ONE_HOUR: "1 hours",
    TWO_HOUR: "2 hours"
}

module.exports = { MATCH_PARTICIPATION_TYPE, MATCH_ATTRIBUTE,MATCH_TYPE,MATCH_FORMATION,MATCH_DURATION,MATCH_POSITION };
