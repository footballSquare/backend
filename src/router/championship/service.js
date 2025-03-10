const client = require("../../database/postgreSQL")
const customError = require("../../util/customError")

const { COMMUNITY_ROLE,
    MATCH_TYPE,
    MATCH_PARTICIPATION_TYPE,
    MATCH_FORMATION,
    MATCH_ATTRIBUTE,
    MATCH_DURATION,
    CHAMPIONSHIP_TYPE, 
    CHAMPIONSHIP_STATUS,
    TEAM_ROLE
} = require("../../constant/constantIndex")


const {
    getMatchTypeSQL,
    findTeamCaptainSQL,
    postTeamMatchSQL,
    postChampionShipMatchSQL
} = require("./sql")

// 대회 매치 생성하기
const postChampionShipMatch = async (req,res,next) => {
    const {championship_list_idx} = req.params
    const {
        first_team_idx,
        second_team_idx,
        match_match_start_time
    } = req.body

    try{
        await client.query("BEGIN");
        // 매치 타입 가져오기
        const matchTypeResult = await client.query(getMatchTypeSQL, [
            championship_list_idx
        ])

        const match_type_idx  = matchTypeResult.rows[0].match_type_idx;
        
        // 1번 팀 주장 가져오기
        const team1CaptainResult = await client.query(findTeamCaptainSQL, [
            first_team_idx,
            TEAM_ROLE.LEADER,
        ])

        const team1_captain_idx = team1CaptainResult.rows[0].player_list_idx;

        // 2번 팀 주장 가져오기
        const team2CaptainResult = await client.query(findTeamCaptainSQL, [
            second_team_idx,
            TEAM_ROLE.LEADER,
        ])

        const team2_captain_idx = team2CaptainResult.rows[0].player_list_idx;

        // 첫 번쨰 팀 매치 생성
        const firstMatchResult = await client.query(postTeamMatchSQL, [
            first_team_idx, 
            team1_captain_idx,
            MATCH_FORMATION[433],
            MATCH_PARTICIPATION_TYPE.APPROVAL_REQUIRED, 
            match_type_idx,
            MATCH_ATTRIBUTE.CHAMPIONSHIP, 
            match_match_start_time, 
            MATCH_DURATION.HALF_HOUR
        ]);

        const first_match_idx = firstMatchResult.rows[0].match_match_idx;

        // 두번째 팀 매치 생성
        const secondMatchResult = await client.query(postTeamMatchSQL, [
            second_team_idx, 
            team2_captain_idx,
            MATCH_FORMATION[433],
            MATCH_PARTICIPATION_TYPE.APPROVAL_REQUIRED, 
            match_type_idx,
            MATCH_ATTRIBUTE.CHAMPIONSHIP, 
            match_match_start_time, 
            MATCH_DURATION.HALF_HOUR
        ]);

        const second_match_idx = secondMatchResult.rows[0].match_match_idx;

        // 대회 매치 추가
        await client.query(postChampionShipMatchSQL, [
            championship_list_idx,
            first_match_idx,
            second_match_idx,
            match_match_start_time,
            MATCH_DURATION.HALF_HOUR
        ])
        await client.query("COMMIT");
        res.status(200).send({})
    } catch(e){
        await client.query("ROLLBACK");
        next(e)
    }
}




module.exports = {
    postChampionShipMatch
}