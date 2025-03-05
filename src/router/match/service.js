const client = require("../../database/postgreSQL")
const customError = require("../../util/customError")

const {
    getTeamMatchListSQL,
    getOpenMatchDataSQL,
    postOpenMatchSQL,
    postTeamMatchSQL,
    putTeamMatchSQL,
    closedMatchSQL,
    deleteWaitlistSQL,
    deleteMatchSQL,
    getMatchDetailDataSQL,
    getMatchParticipantListSQL,
    checkMatchParticipationSQL,
    postMatchParticipantSQL,
    getMatchWaitListSQL,
    deleteFromWaitListSQL,
    insertIntoParticipantSQL,
    postMatchWaitListSQL
} = require("./sql")

// 팀 매치 목록 보기
const getTeamMatchList = async (req,res,next) => {
    const {page} = req.query
    const {team_list_idx} = req.params

    try{
        const result = await client.query(getTeamMatchListSQL, [
            team_list_idx,
            page
        ])
        res.status(200).send({ match : result.rows })
    } catch(e){
        next(e)
    }
}

// 공개 매치 목록 가져오기
const getOpenMatchList = async (req,res,next) => {
    const {page} = req.query
    console.log(1)
    try{
        const result = await client.query(getOpenMatchDataSQL, [page])
        res.status(200).send({ match : result.rows })
    } catch(e){
        next(e)
    }
}

// 공방 매치 생성
const postOpenMatch = async (req,res,next) => {

    const {
        player_list_idx,
        match_formation_idx,
        match_match_participation_type,
        match_type_idx,
        match_match_start_time,
        match_match_duration
    } = req.body

    try{
        await client.query(postOpenMatchSQL, [
            player_list_idx,
            match_formation_idx,
            match_match_participation_type,
            match_type_idx,
            match_match_start_time,
            match_match_duration
        ])
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

// 팀 매치 수정하기
const putTeamMatch = async (req,res,next) => {
    const {team_list_idx} = req.params
    const {
        player_list_idx,
        match_match_idx,
        match_match_participation_type,
        match_match_attribute,
        match_match_start_time,
        match_match_duration
    } = req.body

    try{
        await client.query(putTeamMatchSQL, [
            match_match_idx,
            team_list_idx,
            player_list_idx,
            match_match_participation_type,
            match_match_attribute,
            match_match_start_time,
            match_match_duration
        ])
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

// 매치 마감하기
const closedMatch = async (req,res,next) => {
    const {match_match_idx} = req.params
    const {
        player_list_idx
    } = req.body

    try{
        // 트랜잭션으로 매치를 먼저 마감, 대기자 목록 삭제
        await client.query("BEGIN");
        const closedMatchResult = await client.query(closedMatchSQL, [
            match_match_idx,
            player_list_idx
        ])

        if (closedMatchResult.rowCount === 0) {
            throw customError(404, `해당 매치가(이) 존재하지 않습니다.`);
        }

        await client.query(deleteWaitlistSQL, [match_match_idx]);
        await client.query("COMMIT");

        res.status(200).send({})
    } catch(e){
        await client.query("ROLLBACK");
        res.status(500).send({ 
            message: "매치 마감 중 오류 발생", error: error.message 
        });
    }
}

// 팀 매치 만들기
const postTeamMatch = async (req,res,next) => {
    const {team_list_idx} = req.params
    const {
        player_list_idx,
        match_formation_idx,
        match_match_participation_type,
        match_type_idx,
        match_match_attribute,
        match_match_start_time,
        match_match_duration
    } = req.body

    try{
        await client.query(postTeamMatchSQL, [
            team_list_idx,
            player_list_idx,
            match_formation_idx,
            match_match_participation_type,
            match_type_idx,
            match_match_attribute,
            match_match_start_time,
            match_match_duration
        ])
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

// 매치 삭제하기
const deleteMatch = async (req,res,next) => {
    const {match_match_idx} = req.params

    try{
        await client.query(deleteMatchSQL, [match_match_idx])
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

// 매치 세부정보 가져오기
const getMatchDetailData = async (req,res,next) => {
    const {match_match_idx} = req.params

    try{
        const result = await client.query(getMatchDetailDataSQL, [match_match_idx])
        res.status(200).send({ match : result.rows })
    } catch(e){
        next(e)
    }
}

// 매치 참여자 목록 가져오기
const getMatchParticipantList = async (req,res,next) => {
    const {match_match_idx} = req.params

    try{
        const result = await client.query(getMatchParticipantListSQL, [match_match_idx])
        res.status(200).send({ match_participant : result.rows })
    } catch(e){
        next(e)
    }
}

// 매치 참여 대기자 목록 가져오기
const getMatchWaitList = async (req,res,next) => {
    const {match_match_idx} = req.params

    try{
        const result = await client.query(getMatchWaitListSQL, [match_match_idx])
        const rows = result.rows;

        const matchWaitlist = {};
        rows.forEach(row => {
            if (!matchWaitlist[row.match_position_idx]) {
                matchWaitlist[row.match_position_idx] = [];
            }
            matchWaitlist[row.match_position_idx].push({
                player_list_idx: row.player_list_idx,
                player_list_nickname: row.player_list_nickname,
                player_list_url: row.player_list_url
            });
        });

        res.status(200).send({ match_waitlist : matchWaitlist })
    } catch(e){
        next(e)
    }
}

// 매치 참여 승인하기
const waitApproval = async (req,res,next) => {
    const {match_match_idx} = req.params
    const {
        player_list_idx,
        match_position_idx
    } = req.query

    try{
        // 트랜잭션으로 매치를 먼저 마감, 대기자 목록 삭제
        await client.query("BEGIN");

        const deleteResult = await client.query(deleteFromWaitListSQL, [
            match_match_idx,
            player_list_idx,
            match_position_idx
        ])
        if (deleteResult.rowCount === 0) {
            throw customError(404, `해당 선수가(이) 존재하지 않습니다.`);
        }

        const insertResult = await client.query(insertIntoParticipantSQL, [
            match_match_idx, 
            player_list_idx, 
            match_position_idx
        ]);

        if (insertResult.rowCount === 0) {
            throw customError(404, `특정 데이터가(이) 존재하지 않습니다.`);
        }

        await client.query("COMMIT");

        res.status(200).send({})
    } catch(e){
        await client.query("ROLLBACK");
        res.status(500).send({ 
            message: "매치 참여 승인 중 오류 발생", e : e.message 
        });
    }
}

// 공개 매치 참여하기
const joinOpenMatch = async (req,res,next) => {
    const {match_match_idx} = req.params
    const {match_position_idx,player_list_idx} = req.body

    try{
        const result = await client.query(checkMatchParticipationSQL, [match_match_idx])
        let sql

        result.rows[0].match_match_participation_type == 0 ? sql = postMatchWaitListSQL : sql = postMatchParticipantSQL

        await client.query(sql, [
            match_match_idx,
            player_list_idx,
            match_position_idx
        ])
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

module.exports = {
    getTeamMatchList,
    getOpenMatchList,
    postOpenMatch,
    putTeamMatch,
    closedMatch,
    postTeamMatch,
    deleteMatch,
    getMatchDetailData,
    getMatchParticipantList,
    getMatchWaitList,
    waitApproval,
    joinOpenMatch
}