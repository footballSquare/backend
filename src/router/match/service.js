const client = require("../../database/postgreSQL")
const customError = require("../../util/customError")

const { 
    COMMUNITY_ROLE,
    MATCH_ATTRIBUTE
} = require("../../constant/constantIndex")

const {
    deleteFilesFromS3
} = require("../../database/s3Config/s3Deleter")

const {
    getTeamMatchListSQL,
    getOpenMatchDataSQL,
    postOpenMatchSQL,
    postTeamMatchSQL,
    putTeamMatchSQL,
    putTeamMatchAtChampionShipSQL,
    changeMatchAttributeSQL,
    closedMatchSQL,
    deleteWaitlistSQL,
    deleteMatchSQL,
    getMatchDetailDataSQL,
    getMatchParticipantListSQL,
    checkMatchParticipationSQL,
    postMatchParticipantSQL,
    getMatchWaitListSQL,
    deleteFromWaitListSQL,
    getMatchStanbyListSQL,
    insertIntoParticipantSQL,
    postMatchWaitListSQL,
    postTeamStatsSQL,
    postMomSQL,
    deleteParticipantSQL,
    deletedMatchParticipantSQL,
    deletedMatchWaitListSQL,
    postPlayerStatsSQL
} = require("./sql")


// match_duration 변환 함수
function convertToIntervalString(duration) {
    const { hours = 0, minutes = 0 } = duration || {};
    
    const parts = [];
    if (hours) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
    if (minutes) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
    return parts.join(" ");
  }

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
        match_formation_idx,
        match_match_participation_type,
        match_type_idx,
        match_match_start_time,
        match_match_duration
    } = req.body

    const {
        my_player_list_idx
    } = req.decoded

    console.log(match_match_start_time)

    const intervalString = convertToIntervalString(match_match_duration);

    try{
        const result = await client.query(postOpenMatchSQL, [
            my_player_list_idx,
            match_formation_idx,
            match_match_participation_type,
            match_type_idx,
            match_match_start_time,
            intervalString
        ])

        console.log(result.rows)


        res.status(200).send({ matchData : result.rows[0] })
    } catch(e){
        next(e)
    }
}

// 팀 매치 수정하기
const putTeamMatch = async (req,res,next) => {
    const {team_list_idx,match_match_idx} = req.params
    const {
        match_match_participation_type,
        match_match_attribute,
        match_match_start_time,
        match_match_duration,
        match_formation_idx
    } = req.body

    const {
        my_player_list_idx
    } = req.decoded

    const intervalString = convertToIntervalString(match_match_duration);

    const check_match_match_attribute = req.matchInfo.match_match_attribute
    try{
        if(check_match_match_attribute != MATCH_ATTRIBUTE.CHAMPIONSHIP && match_match_attribute == MATCH_ATTRIBUTE.CHAMPIONSHIP) {
            throw customError(400, `대회 매치로 매치 상태를 변경할 수 없습니다.`)
        }

    
        await client.query("BEGIN");
        // 매치 대기자 목록 삭제
        await client.query(deletedMatchParticipantSQL, [
            match_match_idx
        ])

        // 매치 참여자 삭제
        await client.query(deletedMatchWaitListSQL, [
            match_match_idx
        ])

        
        if(check_match_match_attribute == MATCH_ATTRIBUTE.CHAMPIONSHIP) {
            await client.query(putTeamMatchAtChampionShipSQL,[
                match_match_idx,
                team_list_idx,
                my_player_list_idx,
                match_formation_idx
            ])
        } else {
            await client.query(putTeamMatchSQL, [
                match_match_idx,
                team_list_idx,
                my_player_list_idx,
                match_match_participation_type,
                match_match_attribute,
                match_match_start_time,
                intervalString,
                match_formation_idx
            ])
        }
        await client.query("COMMIT");
        res.status(200).send({})
    } catch(e){
        await client.query("ROLLBACK");
        next(e)
    }
}

// 매치 공개/비공개 매치로 변경
const changeMatchAttribute = async (req,res,next) => {
    const {match_match_idx} = req.params
    const {
        my_team_list_idx
    } = req.decoded

    const { match_match_attribute } = req.matchInfo;
    const changedMatchAttribute = Number(!match_match_attribute)

    try{
        await client.query(changeMatchAttributeSQL, [
            match_match_idx,
            changedMatchAttribute,
            my_team_list_idx
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
        my_player_list_idx
    } = req.decoded

    try{
        // 트랜잭션으로 매치를 먼저 마감, 대기자 목록 삭제
        await client.query("BEGIN");
        await client.query(closedMatchSQL, [
            match_match_idx,
            my_player_list_idx
        ])

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
        match_formation_idx,
        match_match_participation_type,
        match_type_idx,
        match_match_start_time,
        match_match_duration
    } = req.body

    const { my_player_list_idx } = req.decoded

    const intervalString = convertToIntervalString(match_match_duration);

    try{
        const result = await client.query(postTeamMatchSQL, [
            team_list_idx,
            my_player_list_idx,
            match_formation_idx,
            match_match_participation_type,
            match_type_idx,
            MATCH_ATTRIBUTE.PRIVATE,
            match_match_start_time,
            intervalString
        ])
        res.status(200).send({ matchData : result.rows[0] })
    } catch(e){
        next(e)
    }
}

// 매치 삭제하기
const deleteMatch = async (req,res,next) => {
    const {match_match_idx} = req.params

    try{
        await client.query("BEGIN");
        // 매치 대기자 목록 삭제
        await client.query(deletedMatchParticipantSQL, [
            match_match_idx
        ])

        // 매치 참여자 삭제
        await client.query(deletedMatchWaitListSQL, [
            match_match_idx
        ]) 

        // 매치 삭제
        await client.query(deleteMatchSQL, [
            match_match_idx
        ])

        await client.query("COMMIT");

        res.status(200).send({})
    } catch(e){
        await client.query("ROLLBACK");
        next(e)
    }
}

// 매치 대기자 목록 가져오기
const getMatchStanbyList = async (req,res,next) => {

    try{
        const result = await client.query(getMatchStanbyListSQL)
        res.status(200).send({ stanbylist : result.rows })
    } catch(e){
        next(e)
    }
}

// 매치 세부정보 가져오기
const getMatchDetailData = async (req,res,next) => {
    const {match_match_idx} = req.params

    console.log(match_match_idx)

    try{
        const result = await client.query(getMatchDetailDataSQL, [match_match_idx])
        res.status(200).send({ match : result.rows[0] })
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
                player_list_url: row.player_list_url,
                match_waitlist_created_at: row.match_waitlist_created_at
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
    const {match_position_idx} = req.query
    const { my_player_list_idx } = req.decoded

    try{
        const result = await client.query(checkMatchParticipationSQL, [match_match_idx])
        let sql
        
        // 매치 생성자 이거나, 공개 매치일 경우 대기자 목록이 아닌 즉시 참여
        if (result.rows[0].player_list_idx == my_player_list_idx || result.rows[0].match_match_participation_type == 1) sql = postMatchParticipantSQL
        else if(result.rows[0].match_match_participation_type == 0) sql = postMatchWaitListSQL

        await client.query(sql, [
            match_match_idx,
            my_player_list_idx,
            match_position_idx
        ])
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

// 팀 매치 참여하기
const joinTeamMatch = async (req,res,next) => {
    const {match_match_idx} = req.params
    const {match_position_idx} = req.query
    const { my_player_list_idx } = req.decoded
    const {match_match_attribute} = req.matchInfo
    try{
        const result = await client.query(checkMatchParticipationSQL, [match_match_idx])
        
        let sql
        // 매치 생성자 이거나, 공개 매치일 경우 대기자 목록이 아닌 즉시 참여
        if (result.rows[0].player_list_idx == my_player_list_idx || result.rows[0].match_match_participation_type == 1) sql = postMatchParticipantSQL
        else if(result.rows[0].match_match_participation_type == 0) sql = postMatchWaitListSQL
         
        await client.query(sql, [
            match_match_idx,
            my_player_list_idx,
            match_position_idx
        ])

        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

// 매치 참여 해제하기
const leaveMatch = async (req, res,next) => {
    const { target_player_idx } = req.query;
    const { match_match_idx } = req.params;
    const { my_player_list_idx,my_team_list_idx } = req.decoded
    const { match_creator_idx, team_captain_idx, team_list_idx } = req.matchInfo;

    try {
        // 자기 자신을 삭제하는 경우 → 단순히 참가자 목록에서 삭제
        if (my_player_list_idx == target_player_idx) {
            await client.query(deleteParticipantSQL, [match_match_idx, target_player_idx]);
            return res.status(200).send({});
        }

        // 2️⃣ 매치 생성자 또는 팀 주장인 경우 → 참가자 목록에서 삭제 후, 대기자 목록으로 이동
        else if (my_player_list_idx == match_creator_idx || (my_player_list_idx == team_captain_idx && team_list_idx == my_team_list_idx)) {
            
            await client.query("BEGIN"); // 트랜잭션 시작

            // 2-1️⃣ 참가자 목록에서 삭제
            const deleteParticipantReturnPositionSQL = `
                DELETE FROM match.participant
                WHERE match_match_idx = $1 AND player_list_idx = $2
                RETURNING match_position_idx;
            `;
            const deleteParticipantResult = await client.query(deleteParticipantReturnPositionSQL, [match_match_idx, target_player_idx]);

            if (deleteParticipantResult.rowCount === 0) {
                await client.query("ROLLBACK");
                throw customError(403, `매치에 참여하고 있지 않은 선수.`);
            }

            const match_position_idx = deleteParticipantResult.rows[0].match_position_idx;

            // 2-2️⃣ 대기자 목록에 추가
            const insertWaitlistSQL = `
                INSERT INTO match.waitlist (
                    match_match_idx,
                    player_list_idx,
                    match_position_idx
                ) VALUES ($1, $2, $3);
            `;
            await client.query(insertWaitlistSQL, [match_match_idx, target_player_idx, match_position_idx]);

            await client.query("COMMIT");
            return res.status(200).send({});
        }

        // 3️⃣ 위 조건을 만족하지 않으면 삭제 불가능
        throw customError(403, `권한 없음.`);

    } catch(e) {
        next(e);
    }
};

// 팀 스탯 입력 / 수정 하기 
const postTeamStats = async (req, res, next) => {
  const { match_match_idx } = req.params;
  const {
    match_team_stats_our_score,
    match_team_stats_other_score,
    match_team_stats_possession,
    match_team_stats_total_shot,
    match_team_stats_expected_goal,
    match_team_stats_total_pass,
    match_team_stats_total_tackle,
    match_team_stats_success_tackle,
    match_team_stats_saved,
    match_team_stats_cornerkick,
    match_team_stats_freekick,
    match_team_stats_penaltykick,
    mom_player_idx
  } = req.body;

  const { my_team_list_idx } = req.decoded;

  try {
    await client.query("BEGIN");

    // UPSERT
    const result = await client.query(postTeamStatsSQL, 
    [
      match_match_idx,
      my_team_list_idx,
      match_team_stats_our_score,
      match_team_stats_other_score,
      match_team_stats_possession,
      match_team_stats_total_shot,
      match_team_stats_expected_goal,
      match_team_stats_total_pass,
      match_team_stats_total_tackle,
      match_team_stats_success_tackle,
      match_team_stats_saved,
      match_team_stats_cornerkick,
      match_team_stats_freekick,
      match_team_stats_penaltykick
    ]);

    const match_team_stats_idx = result.rows[0].match_team_stats_idx;

    // MOM 업데이트: 먼저 삭제 후 삽입
    await client.query(`
      DELETE FROM match.mom
      WHERE match_match_idx = $1 AND match_team_stats_idx = $2
    `, [match_match_idx, match_team_stats_idx]);

    await client.query(postMomSQL, [
        match_match_idx, 
        match_team_stats_idx, 
        mom_player_idx
    ]);

    await client.query("COMMIT");
    res.status(200).json({ message: "팀 스탯 기록 등록/수정 완료" });

  } catch (e) {
    await client.query("ROLLBACK");
    console.error("❌ 팀 스탯 입력/수정 실패:", e.message);
    next(e);
  }
};


// 팀 스탯 증빙자료 입력 / 수정하기 
const postTeamStatsEvidence = async (req, res, next) => {
  const { match_match_idx } = req.params;
  const { my_team_list_idx } = req.decoded;
  const urls = req.body.url || []; // 클라이언트가 유지하고자 한 URL
  const fileUrls = req.fileUrls || []; // 새로 업로드된 URL
  const teamStatsRow = req.teamStatsRow; // 기존 팀 스탯 row (null일 수도 있음)
  const verifiedUrls = req.verifiedUrls || []; // 검증된 기존 URL

  try {
    const finalUrls = [...verifiedUrls, ...fileUrls];

    // 삭제 대상 URL 추출
    const existingUrls = teamStatsRow?.match_team_stats_evidence_img || [];
    const urlsToDelete = existingUrls.filter((url) => !verifiedUrls.includes(url));

    // 1. 기존 기록이 있으면 → update
    if (teamStatsRow) {
      await client.query(`
        UPDATE match.team_stats
        SET match_team_stats_evidence_img = $1
        WHERE match_team_stats_idx = $2
      `, [JSON.stringify(finalUrls), teamStatsRow.match_team_stats_idx]);
    } else {
      // 2. 기존 기록이 없으면 → insert
      const { rows } = await client.query(`
        SELECT team_list_name
        FROM team.list
        WHERE team_list_idx = $1
      `, [my_team_list_idx]);

      const team_list_name = rows[0]?.team_list_name || null;

      await client.query(`
        INSERT INTO match.team_stats (
          match_match_idx,
          team_list_idx,
          team_list_name,
          match_team_stats_evidence_img
        ) VALUES ($1, $2, $3, $4)
      `, [match_match_idx, my_team_list_idx, team_list_name, JSON.stringify(finalUrls)]);
    }

    // 3. 삭제 대상이 있으면 → S3에서 삭제
    if (urlsToDelete.length > 0) {
      await deleteFilesFromS3(urlsToDelete);
    }

    res.status(200).send({
        message: "팀 스탯 증빙자료 등록/수정 완료",
        fileUrls: finalUrls
    })
  } catch (e) {
    console.error("❌ 팀 스탯 증빙자료 처리 실패:", e.message);
    next(e)
  }
};

// 개인 스탯 증빙자료 입력 / 수정
const postPlayerStatsEvidence = async (req, res, next) => {
  const { match_match_idx } = req.params;
  const { my_player_list_idx } = req.decoded;
  const urls = req.body.url || []; // 유지하려는 기존 URL
  const fileUrls = req.fileUrls || []; // 새로 업로드된 URL
  const playerStatsRow = req.playerStatsRow; // 기존 개인 스탯 row (null 가능)
  const verifiedUrls = req.verifiedUrls || []; // 검증된 기존 URL

  try {
    const finalUrls = [...verifiedUrls, ...fileUrls];

    // 삭제 대상 URL 추출
    const existingUrls = playerStatsRow?.match_player_stats_evidence_img || [];
    const urlsToDelete = existingUrls.filter((url) => !verifiedUrls.includes(url));

    // 1. 기존 스탯 존재 → update
    if (playerStatsRow) {
      await client.query(`
        UPDATE match.player_stats
        SET match_player_stats_evidence_img = $1
        WHERE match_player_stats_idx = $2
      `, [JSON.stringify(finalUrls), playerStatsRow.match_player_stats_idx]);
    } else {
      // 2. 기존 없음 → insert
      const { rows } = await client.query(`
        SELECT player_list_nickname
        FROM player.list
        WHERE player_list_idx = $1
      `, [my_player_list_idx]);

      const player_list_nickname = rows[0]?.player_list_nickname || null;

      await client.query(`
        INSERT INTO match.player_stats (
          match_match_idx,
          player_list_idx,
          player_list_nickname,
          match_player_stats_evidence_img
        ) VALUES ($1, $2, $3, $4)
      `, [match_match_idx, my_player_list_idx, player_list_nickname, JSON.stringify(finalUrls)]);
    }

    // 3. S3 삭제
    if (urlsToDelete.length > 0) {
      await deleteFilesFromS3(urlsToDelete);
    }

    res.status(200).json({
      message: "개인 스탯 증빙자료 등록/수정 완료",
      fileUrls: finalUrls
    });
  } catch (e) {
    console.error("❌ 개인 스탯 증빙자료 처리 실패:", e.message);
    next(e);
  }
};

// 개인 스탯 입력하기
const postPlayerStats = async (req,res,next) => {
    const {match_match_idx} = req.params
    const {
        match_player_stats_goal,
        match_player_stats_assist,
        match_player_stats_successrate_pass,
        match_player_stats_successrate_dribble,
        match_player_stats_successrate_tackle,
        match_player_stats_possession,
        match_player_stats_standing_tackle,
        match_player_stats_sliding_tackle,
        match_player_stats_cutting,
        match_player_stats_saved,
        match_player_stats_successrate_saved
    } = req.body

    const { my_player_list_idx } = req.decoded

    try{
        await client.query(postPlayerStatsSQL, [
            match_match_idx,
            my_player_list_idx,
            match_player_stats_goal,
            match_player_stats_assist,
            match_player_stats_successrate_pass,
            match_player_stats_successrate_dribble,
            match_player_stats_successrate_tackle,
            match_player_stats_possession,
            match_player_stats_standing_tackle,
            match_player_stats_sliding_tackle,
            match_player_stats_cutting,
            match_player_stats_saved,
            match_player_stats_successrate_saved
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
    changeMatchAttribute,
    closedMatch,
    postTeamMatch,
    deleteMatch,
    getMatchStanbyList,
    getMatchDetailData,
    getMatchParticipantList,
    getMatchWaitList,
    waitApproval,
    joinOpenMatch,
    joinTeamMatch,
    leaveMatch,
    postTeamStats,
    postTeamStatsEvidence,
    postPlayerStatsEvidence,
    postPlayerStats
}
