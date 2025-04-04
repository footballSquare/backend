const customError = require("../util/customError")
const client = require("../database/postgreSQL")

const {
    TEAM_ROLE,
    COMMUNITY_ROLE
} = require("../constant/constantIndex")

// 이미 소속 팀이 존재하는지 여부 체크
const checkHasTeam = () => {
    return async (req, res, next) => {
        const { my_team_list_idx } = req.decoded;
        console.log(req.decoded)

        try {
            if (my_team_list_idx !== null) {
                throw customError(403, "소속 팀이 존재합니다.");
            }
            next();
        } catch (e) {
            next(e);
        }
    };
};

// 팀장인지 권한 체크
const checkIsTeamLeader = () => {
    return async (req, res, next) => {
        const { my_team_role_idx } = req.decoded;

        try {
            if (my_team_role_idx != TEAM_ROLE.LEADER) {
                throw customError(403, "권한이 부족합니다.");
            }
            next();
        } catch (e) {
            next(e);
        }
    };
};

// 팀장 또는 부팀장 인지 권한 체크
const checkIsTeamSubLeader = () => {
    return async (req, res, next) => {
        const { my_team_role_idx } = req.decoded;

        try {
            if (my_team_role_idx != TEAM_ROLE.LEADER 
                && my_team_role_idx != TEAM_ROLE.SUB_LEADER
            ) {
                throw customError(403, "권한이 부족합니다.");
            }
            next();
        } catch (e) {
            next(e);
        }
    };
};

// 해당 팀의 팀원인지 체크
const checkIsTeamMember = () => {
    return async (req, res, next) => {
        const { my_team_list_idx } = req.decoded;
        const value = req.body.team_list_idx ?? req.params.team_list_idx ?? req.query.team_list_idx ?? req.matchInfo.team_list_idx;;

        try {
            if (my_team_list_idx != value) {
                throw customError(403, "해당 팀의 팀원이 아닙니다.");
            }
            next();
        } catch (e) {
            next(e);
        }
    };
};

// 매치의 정보에서 해당 팀의 팀원인지 체크
const checkIsTeamMemberAtMatch = () => {
    return async (req, res, next) => {
        const { my_team_list_idx } = req.decoded;
        const value = req.matchInfo.team_list_idx;

        try {
            if (my_team_list_idx != value) {
                throw customError(403, "해당 팀의 팀원이 아닙니다.");
            }
            next();
        } catch (e) {
            next(e);
        }
    };
};

// 커뮤니티 운영자인지 체크
const checkIsCommunityAdminRole = () => {
    return async (req, res, next) => {
        const { my_community_role_idx } = req.decoded;

        try {
            if (my_community_role_idx != COMMUNITY_ROLE.ADMIN) {
                throw customError(403, "커뮤니티 운영자가 아닙니다.");
            }
            next();
        } catch (e) {
            next(e);
        }
    };
};

// 커뮤니티 운영자인지 체크
const checkHasCommunityRole = () => {
    return async (req, res, next) => {
        const { my_community_role_idx } = req.decoded;

        try {
            if (my_community_role_idx) {
                throw customError(403, "이미 커뮤니티 운영진 입니다.");
            }
            next();
        } catch (e) {
            next(e);
        }
    };
};

// 커뮤니티 운영진인지 체크
const checkIsCommunityStaffRole = () => {
    return async (req, res, next) => {
        console.log(req.decoded)
        const { my_community_role_idx } = req.decoded;

        try {
            if (my_community_role_idx != COMMUNITY_ROLE.ADMIN &&
                my_community_role_idx != COMMUNITY_ROLE.STAFF
             ) {
                throw customError(403, "커뮤니티 운영진이 아닙니다.");
            }
            next();
        } catch (e) {
            next(e);
        }
    };
};

module.exports = {
    checkIsTeamLeader,
    checkIsTeamSubLeader,
    checkHasTeam,
    checkIsTeamMember,
    checkIsTeamMemberAtMatch,
    checkIsCommunityAdminRole,
    checkHasCommunityRole,
    checkIsCommunityStaffRole
}

