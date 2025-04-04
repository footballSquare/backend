const client = require("../../database/postgreSQL")
const customError = require("../../util/customError")

const { 
    COMMUNITY_ROLE,
    MATCH_TYPE,
    MATCH_PARTICIPATION_TYPE,
    MATCH_FORMATION,
    MATCH_ATTRIBUTE,
    MATCH_DURATION,
    CHAMPIONSHIP_TYPE, 
    CHAMPIONSHIP_STATUS,
    TEAM_ROLE,
    COMMON_STATUS
} = require("../../constant/constantIndex")


const {
    getMatchTypeSQL,
    findTeamCaptainSQL,
    postTeamMatchSQL,
    getChampionshipMatchIdx,
    deleteEachMatchSQL,
    deleteChampionshipMatchSQL,
    matchDoneSQL,
    postChampionShipMatchSQL,
    fetchEvidanceImgSQL,
    getChampionShipDataSQL,
    getChampionShipParticipationTeamSQL,
    fetchChampionshipMatchesSQL,
    fetchTeamInfoSQL,
    fetchMatchStatsSQL,
    fetchChampionShipMatchSQL,
    getChampionShipPlayerStatsSQL
} = require("./sql")


// 대회 종료하기
const doneChampionship = async (req,res,next) => {
    const {championship_list_idx} = req.params

    try{
        await client.query("BEGIN");

        const result = await client.query(getChampionShipPlayerStatsSQL, [
            championship_list_idx
        ])

        await client.query("COMMIT");
        res.status(200).send({ result : result.rows })
    } catch(e){
        await client.query("ROLLBACK");
        next(e)
    }
}


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

// 대회 매치 삭제하기
const deleteChampionShipMatch = async (req,res,next) => {
    const {championship_match_idx} = req.params
    const {

    } = req.body

    try{
        await client.query("BEGIN");
        console.log("들어옴")

        // 각 팀의 매치 인덱스 가져오기
        const result = await client.query(getChampionshipMatchIdx, [championship_match_idx]);

        const { championship_match_first_idx, championship_match_second_idx } = result.rows[0];

        // 각 팀의 매치 삭제
        await client.query(deleteEachMatchSQL, [
            championship_match_first_idx,
            championship_match_second_idx
        ]);

        // 대회 매치 삭제
        await client.query(deleteChampionshipMatchSQL, [
            championship_match_idx
        ]);

        await client.query("COMMIT");

        res.status(200).send({})
    } catch(e){
        await client.query("ROLLBACK");
        next(e)
    }
}

// 대회 매치 마감하기
const championShipMatchDone = async (req,res,next) => {
    const {championship_match_idx} = req.params
    const {

    } = req.body

    try{
        await client.query("BEGIN");
        console.log(championship_match_idx)
        // 각 팀의 매치 인덱스 가져오기
        const result = await client.query(getChampionshipMatchIdx, [championship_match_idx]);

        const { championship_match_first_idx, championship_match_second_idx } = result.rows[0];

        // 각 팀의 매치 마감하기
        await client.query(matchDoneSQL, [
            championship_match_first_idx,
            championship_match_second_idx,
            COMMON_STATUS.MATCH_STATS_CLOSED
        ]);

        await client.query("COMMIT");

        res.status(200).send({})
    } catch(e){
        await client.query("ROLLBACK");
        next(e)
    }
}


// 대회 매치 증빙 자료 가져오기
const fetchEvidanceImg = async (req,res,next) => {
    const {championship_match_idx} = req.params

    try{
        const result = await client.query(fetchEvidanceImgSQL, [
            championship_match_idx
        ])
        res.status(200).send({ evidance_img : result.rows })
    } catch(e){
        next(e)
    }
}

// 대회 세부 정보 가져오기
const getChampionShipData = async (req,res,next) => {
    const {championship_list_idx} = req.params

    try{
        const result = await client.query(getChampionShipDataSQL, [
            championship_list_idx
        ])
        res.status(200).send({ championship_data : result.rows[0] })
    } catch(e){
        next(e)
    }
}

// 대회 참여 팀 가져오기
const getChampionShipParticipationTeam = async (req,res,next) => {
    const {championship_list_idx} = req.params

    try{
        const result = await client.query(getChampionShipParticipationTeamSQL, [
            championship_list_idx
        ])
        res.status(200).send({ participation_team : result.rows })
    } catch(e){
        next(e)
    }
}

// 대회 매치 목록 가져오기
const getChampionShipMatchList = async (req,res,next) => {
    const {championship_list_idx} = req.params

    try{
        // 대회 매치 목록 가져오기
        const championshipMatchResult = await client.query(fetchChampionshipMatchesSQL, [championship_list_idx]);
        const championshipMatchList = championshipMatchResult.rows;

        // 매치에 포함된 팀 ID 수집
        const teamIdList = [];
        championshipMatchList.forEach(match => {
            if (match.first_team_idx && !teamIdList.includes(match.first_team_idx)) {
                teamIdList.push(match.first_team_idx);
            }
            if (match.second_team_idx && !teamIdList.includes(match.second_team_idx)) {
                teamIdList.push(match.second_team_idx);
            }
        });

        // 팀 정보 가져오기
        const teamResult = await client.query(fetchTeamInfoSQL, [teamIdList]);
        const teamInfoMap = new Map(teamResult.rows.map(team => [team.team_list_idx, team]));

        // 매치 스탯 가져오기
        const matchIdList = championshipMatchList.map(m => m.championship_match_first_idx)
            .concat(championshipMatchList.map(m => m.championship_match_second_idx))
            .filter(Boolean);
        let matchStatsMap = new Map();


        if (matchIdList.length > 0) {
            const matchStatsResult = await client.query(fetchMatchStatsSQL, [matchIdList]);

            matchStatsResult.rows.forEach(stat => {
                if (!matchStatsMap.has(stat.match_match_idx)) {
                    matchStatsMap.set(stat.match_match_idx, {});
                }
        
                // 단순 객체 형태로 매핑 (team1 / team2 방식)
                matchStatsMap.get(stat.match_match_idx)[Number(stat.team_list_idx)] = {
                    match_team_stats_our_score: stat.match_team_stats_our_score,
                    match_team_stats_other_score: stat.match_team_stats_other_score
                };
            });
        }
        
        // 데이터 병합 및 응답 생성
        const championshipMatches = championshipMatchList.map(match => {
            const firstTeam = teamInfoMap.get(match.first_team_idx) || null;
            const secondTeam = teamInfoMap.get(match.second_team_idx) || null;
        
            // 매치별 인덱스 가져오기
            const firstMatchIdx = match.championship_match_first_idx;
            const secondMatchIdx = match.championship_match_second_idx;
        
            // 해당 매치의 모든 팀 스탯 가져오기
            const firstMatchStats = matchStatsMap.get(firstMatchIdx) || {};
            const secondMatchStats = matchStatsMap.get(secondMatchIdx) || {};
        
            return {
                championship_match_idx: match.championship_match_idx, 
                championship_match_first: firstTeam ? {
                    match_match_idx: firstMatchIdx, 
                    team_list_idx: match.first_team_idx,
                    team_list_name: firstTeam.team_list_name,
                    team_list_short_name: firstTeam.team_list_short_name,
                    team_list_color: firstTeam.team_list_color,
                    team_list_emblem: firstTeam.team_list_emblem,
                    match_team_stats_our_score: firstMatchStats[match.first_team_idx]?.match_team_stats_our_score ?? null,
                    match_team_stats_other_score: firstMatchStats[match.first_team_idx]?.match_team_stats_other_score ?? null
                } : null,
                championship_match_second: secondTeam ? {
                    match_match_idx: secondMatchIdx, 
                    team_list_idx: match.second_team_idx,
                    team_list_name: secondTeam.team_list_name,
                    team_list_short_name: secondTeam.team_list_short_name,
                    team_list_color: secondTeam.team_list_color,
                    team_list_emblem: secondTeam.team_list_emblem,
                    match_team_stats_our_score: secondMatchStats[match.second_team_idx]?.match_team_stats_our_score ?? null,
                    match_team_stats_other_score: secondMatchStats[match.second_team_idx]?.match_team_stats_other_score ?? null
                } : null
            };
        });
        
        res.status(200).json({ championship_match: championshipMatches });
    } catch(e){
        next(e)
    }
}

// 대회 매치 세부 정보 가져오기
const fetchChampionShipMatch = async (req,res,next) => {
    const {championship_match_idx} = req.params

    try{
        const result = await client.query(fetchChampionShipMatchSQL, [
            championship_match_idx
        ])

        const formatChampionshipMatchResponse = (championshipData) => {
            const {
              championship_match_idx,
              championship_list_idx,
              match_match_start_time,
              match_match_duration,
              championship_match_first_idx,
              championship_match_second_idx,
              first_match_formation_idx,
              second_match_formation_idx,
          
              first_team_idx,
              first_team_our_score,
              first_team_other_score,
              first_team_possession,
              first_team_total_shot,
              first_team_expected_goal,
              first_team_total_pass,
              first_team_total_tackle,
              first_team_success_tackle,
              first_team_saved,
              first_team_cornerkick,
              first_team_freekick,
              first_team_penaltykick,
              first_team_mom_idx,
              first_team_mom_nickname,
          
              second_team_idx,
              second_team_our_score,
              second_team_other_score,
              second_team_possession,
              second_team_total_shot,
              second_team_expected_goal,
              second_team_total_pass,
              second_team_total_tackle,
              second_team_success_tackle,
              second_team_saved,
              second_team_cornerkick,
              second_team_freekick,
              second_team_penaltykick,
              second_team_mom_idx,
              second_team_mom_nickname,
          
              player_stats
            } = championshipData;
          
            // 선수 스탯 분리
            const firstTeamPlayerStats = [];
            const secondTeamPlayerStats = [];
          
            player_stats.forEach((player) => {
              if (player.match_match_idx === championship_match_first_idx) {
                firstTeamPlayerStats.push(player);
              } else if (player.match_match_idx === championship_match_second_idx) {
                secondTeamPlayerStats.push(player);
              }
            });
          
            return {
              championship_match_idx,
              championship_list_idx,
              match_info: {
                match_match_start_time,
                match_match_duration,
                first_match_formation_idx,
                second_match_formation_idx
              },
              first_team: {
                team_list_idx: first_team_idx,
                stats: {
                  match_team_stats_our_score: first_team_our_score,
                  match_team_stats_other_score: first_team_other_score,
                  match_team_stats_possession: first_team_possession,
                  match_team_stats_total_shot: first_team_total_shot,
                  match_team_stats_expected_goal: first_team_expected_goal,
                  match_team_stats_total_pass: first_team_total_pass,
                  match_team_stats_total_tackle: first_team_total_tackle,
                  match_team_stats_success_tackle: first_team_success_tackle,
                  match_team_stats_saved: first_team_saved,
                  match_team_stats_cornerkick: first_team_cornerkick,
                  match_team_stats_freekick: first_team_freekick,
                  match_team_stats_penaltykick: first_team_penaltykick,
                  mom_player_idx: first_team_mom_idx,
                  mom_player_nickname: first_team_mom_nickname
                },
                player_stats: firstTeamPlayerStats
              },
              second_team: {
                team_list_idx: second_team_idx,
                stats: {
                  match_team_stats_our_score: second_team_our_score,
                  match_team_stats_other_score: second_team_other_score,
                  match_team_stats_possession: second_team_possession,
                  match_team_stats_total_shot: second_team_total_shot,
                  match_team_stats_expected_goal: second_team_expected_goal,
                  match_team_stats_total_pass: second_team_total_pass,
                  match_team_stats_total_tackle: second_team_total_tackle,
                  match_team_stats_success_tackle: second_team_success_tackle,
                  match_team_stats_saved: second_team_saved,
                  match_team_stats_cornerkick: second_team_cornerkick,
                  match_team_stats_freekick: second_team_freekick,
                  match_team_stats_penaltykick: second_team_penaltykick,
                  mom_player_idx: second_team_mom_idx,
                  mom_player_nickname: second_team_mom_nickname
                },
                player_stats: secondTeamPlayerStats
              }
            };
        };

        const formattedResponse = formatChampionshipMatchResponse(result.rows[0]);
        
        res.status(200).send({ championship_match: formattedResponse });
    } catch(e){
        next(e)
    }
}

// 대회 개인 스탯 가져오기
const getChampionShipPlayerStats = async (req,res,next) => {
    const {championship_list_idx} = req.params

    try{
        const result = await client.query(getChampionShipPlayerStatsSQL, [
            championship_list_idx
        ])
        res.status(200).send({ result : result.rows })
    } catch(e){
        next(e)
    }
}



module.exports = {
    postChampionShipMatch,
    deleteChampionShipMatch,
    championShipMatchDone,
    getChampionShipData,
    getChampionShipParticipationTeam,
    getChampionShipMatchList,
    fetchChampionShipMatch,
    fetchEvidanceImg,
    getChampionShipPlayerStats
}