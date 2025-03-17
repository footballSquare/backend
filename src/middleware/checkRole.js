const customError = require("../util/customError")
const client = require("../database/postgreSQL")

const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        const { my_team_role_idx } = req.decoded; 

        if (!allowedRoles.includes(my_team_role_idx)) {
            return next(customError(403, "권한이 부족합니다."));
        }
        next();
    };
};

const checkIsTeamLeader = () => {
    return async (req, res, next) => {
        const value = req.decoded.my_team_role_idx;

        const sql = ``;

        try {
            const result = await client.query(sql, [value]);
            if (!result.rows.length) {
                throw customError(403, `권한 없음`);
            }
            next();
        } catch (e) {
            next(e);
        }
    };
};



module.exports = {
    checkRole
}

