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
        
        // 매치 생성자 이거나, 공개 매치일 경우 대기자 목록이 아닌 즉시 참여
        if (result.rows[0].player_list_idx == player_list_idx || result.rows[0].match_match_participation_type == 1) sql = postMatchParticipantSQL
        else if(result.rows[0].match_match_participation_type == 0) sql = postMatchWaitListSQL
         
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

// 매치 참여 해제하기
const leaveMatch = async (req,res,next) => {
    const {match_match_idx} = req.params
    const {player_list_idx} = req.body
    const {target_player_idx} = req.query

    try {
        await client.query("BEGIN");
    
        // 1. 매치 정보 조회 (생성자 및 팀 정보 확인)
        const checkMatchSQL = `
            SELECT player_list_idx AS match_creator_idx, team_list_idx 
            FROM match.match 
            WHERE match_match_idx = $1;
        `;
        const matchResult = await client.query(checkMatchSQL, [match_match_idx]);
    
        if (matchResult.rowCount === 0) {
            throw customError(404, `해당 매치가(이) 존재하지 않습니다.`);
        }
    
        const match_creator_idx = matchResult.rows[0].match_creator_idx;
        const match_team_idx = matchResult.rows[0].team_list_idx;
        let isTeamGame = match_team_idx !== null;
        let isCaptain = false;
    
        // 2. 팀 게임일 경우, 해당 플레이어가 주장인지 확인
        if (isTeamGame) {
            const checkCaptainSQL = `
                SELECT team_role_idx 
                FROM team.member 
                WHERE team_list_idx = $1 AND player_list_idx = $2;
            `;
            const captainResult = await client.query(checkCaptainSQL, [match_team_idx, player_list_idx]);
    
            if (captainResult.rowCount > 0 && captainResult.rows[0].team_role_idx === 0) {
                isCaptain = true; // 팀 주장일 경우
            }
        }
    
        // 3. 삭제 가능한 조건 체크
        const canRemove =
            player_list_idx === match_creator_idx || // 매치 생성자이거나
            player_list_idx === target_player_idx || // 자기 자신을 삭제하거나
            isCaptain; // 팀 주장인 경우
    
        if (!canRemove) {
            throw customError(403, `해당 매치가(이) 존재하지 않습니다.`);
        }
    
        // 4. 참가자 목록에서 해당 선수 삭제
        const deleteParticipantSQL = `
            DELETE FROM match.participant
            WHERE match_match_idx = $1 AND player_list_idx = $2
            RETURNING player_list_idx;
        `;
        const deleteParticipantResult = await client.query(deleteParticipantSQL, [match_match_idx, target_player_idx]);
    
        if (deleteParticipantResult.rowCount === 0) {
            throw new Error("참여 해제 실패: 해당 플레이어는 매치에 참여하고 있지 않음");
        }
    
        await client.query("COMMIT");
        res.status(200).send({});
    } catch (e) {
        await client.query("ROLLBACK");
        next(e);
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
    joinOpenMatch,
    leaveMatch
}
