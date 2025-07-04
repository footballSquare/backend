const customError = require("../util/customError")
const client = require("../database/postgreSQL")

const {
    TEAM_ROLE,
    COMMUNITY_ROLE,
    BOARD_CATEGORY
} = require("../constant/constantIndex")

// 이미 소속 팀이 존재하는지 여부 체크
const checkHasTeam = () => {
    return (req, res, next) => {
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
    return (req, res, next) => {
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

// 팀장이 아닌지 권한 체크
const checkIsNotTeamLeader = () => {
    return (req, res, next) => {
        const { my_team_role_idx } = req.decoded;

        try {
            if (my_team_role_idx == TEAM_ROLE.LEADER) {
                throw customError(403, "팀장은 탈퇴할 수 없습니다.");
            }
            next();
        } catch (e) {
            next(e);
        }
    };
};

// 팀장 또는 부팀장 인지 권한 체크
const checkIsTeamSubLeader = () => {
    return (req, res, next) => {
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
    return (req, res, next) => {
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
    return (req, res, next) => {
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
    return (req, res, next) => {
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
    return (req, res, next) => {
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
    return (req, res, next) => {
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

const checkIsYourCommunity = () => {
    return (req, res, next) => {
        const { my_community_list_idx } = req.decoded;
        const { community_list_idx } = req.params ?? req.body ?? req.query

        try {
            if (my_community_list_idx != community_list_idx) {
                throw customError(403, "해당 커뮤니티의 운영진이 아닙니다.");
            }
            next();
        } catch (e) {
            next(e);
        }
    };
};

// 자신의 커뮤니티 인지 체크
const checkIsYourCommunityAtDB = () => {
    return async (req, res, next) => {
        const { my_community_list_idx } = req.decoded;
        const { championship_list_idx } = req.params ?? req.body ?? req.query

        try {
            const result = await client.query(`
                SELECT * FROM championship.list WHERE championship_list_idx = $1
                `, [championship_list_idx]);
                
            if (my_community_list_idx != result.rows[0].community_list_idx) {
                throw customError(403, "해당 커뮤니티의 운영진이 아닙니다.");
            }
            next();
        } catch (e) {
            next(e);
        }
    };
};

const checkIsYourCommunityByMatchIdx = () => {
  return async (req, res, next) => {
    const { my_community_list_idx } = req.decoded;
    const { championship_match_idx } = req.params ?? req.body ?? req.query;

    const sql = `
      SELECT cl.community_list_idx
      FROM championship.championship_match cm
      JOIN championship.list cl ON cm.championship_list_idx = cl.championship_list_idx
      WHERE cm.championship_match_idx = $1
    `;

    try {
      const result = await client.query(sql, [championship_match_idx]);

      const matchCommunityIdx = result.rows[0].community_list_idx;

      if (matchCommunityIdx !== my_community_list_idx) {
        throw customError(403, "해당 커뮤니티의 운영진이 아닙니다.");
      }

      next();
    } catch (e) {
      next(e);
    }
  };
};


// 대회 매치인지 아닌지 체크
const checkHasTeamOrCommunity = () => {
  return (req, res, next) => {
    try {
      let category = req.query.category;
      const {my_team_list_idx,my_community_list_idx} = req.decoded;
        
      if(category == BOARD_CATEGORY.COMMUNITY_BOARD) {
        if(my_community_list_idx == null) throw customError(403, "소속 커뮤니티가 없습니다.");
        }
      else if (category == BOARD_CATEGORY.TEAM_BOARD) {
        if(my_team_list_idx == null)throw customError(403, "소속팀이 없습니다.");
        }
    //   else if (category == BOARD_CATEGORY.FREE_BOARD) {throw customError(403, "현재 사용할 수 없는 게시판 입니다.");}
      next();
    } catch (e) {
      next(e);
    }
  };
};


module.exports = {
    checkIsTeamLeader,
    checkIsNotTeamLeader,
    checkIsTeamSubLeader,
    checkHasTeam,
    checkIsTeamMember,
    checkIsTeamMemberAtMatch,
    checkIsCommunityAdminRole,
    checkHasCommunityRole,
    checkIsCommunityStaffRole,
    checkIsYourCommunity,
    checkIsYourCommunityAtDB,
    checkIsYourCommunityByMatchIdx,
    checkHasTeamOrCommunity
}

