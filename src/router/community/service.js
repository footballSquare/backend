const client = require("../../database/postgreSQL")
const customError = require("../../util/customError")

const { COMMUNITY_ROLE,
    MATCH_TYPE,
    CHAMPIONSHIP_TYPE, 
    CHAMPIONSHIP_STATUS 
} = require("../../constant/constantIndex")

const {deleteFileFromS3} = require("../../database/s3Config/s3Deleter")

const {
    getCommunityBoardListSQL,
    postCommunityBoardSQL,
    getCommunitySQL,
    getCommunityStaffSQL,
    getCommunityTeamSQL,
    getCommunityChampionshipSQL,
    putCommunityNoticeSQL,
    postChampioshipSQL,
    postChampioshipParticipantTeamSQL,
    postChampioshipAwardSQL,
    communityStaffAccessSQL,
    communityStaffAccessDenySQL,
    kickCommunityStaffSQL,
    communityStaffApplicationSQL,
    getCommunityStaffApplicationSQL,
    getCommunityTeamApplicationSQL,
    communityTeamApplicationSQL,
    communityTeamAccessSQL,
    communityTeamAccessDenySQL,
    communityTeamKickSQL
} = require("./sql")

const {
    sequenceAutoIncrease
} = require("../commonSQL")

// 게시글 목록 가져오기
const getCommunityBoardList = async (req,res,next) => {
    const {community_list_idx} = req.params
    const {page} = req.query

    try{
        const result = await client.query(getCommunityBoardListSQL, [
            community_list_idx,
            page
        ]);

        res.status(200).send({
            board_list : result.rows
        })
    } catch(e){
        next(e)
    }
}

// // 커뮤니티 게시글 작성하기
// const postCommunityBoard = async (req,res,next) => {
//     const {community_list_idx} = req.params
//     const {
//         board_list_title,
//         board_list_content
//     } = req.body

//     const { my_player_list_idx } = req.decoded

//     const new_img_url = req.fileUrl

//     try{
//         await client.query(postCommunityBoardSQL, [
//             board_list_title,
//             board_list_content,
//             my_player_list_idx,  
//             new_img_url,
//             community_list_idx
//         ]);

//         res.status(200).send({})
//     } catch(e){
//         next(e)
//     }
// }

// 커뮤니티 정보 보기
const getCommunity = async (req,res,next) => {
    const {community_list_idx} = req.params

    try{
        const result = await client.query(getCommunitySQL, [
            community_list_idx
        ])
        res.status(200).send({ community : result.rows[0] })
    } catch(e){
        next(e)
    }
}

// 커뮤니티 운영진 목록 보기
const getCommunityStaff = async (req,res,next) => {
    const {community_list_idx} = req.params

    try{
        const result = await client.query(getCommunityStaffSQL, [
            community_list_idx
        ])
        res.status(200).send({ community_staff : result.rows })
    } catch(e){
        next(e)
    }
}

// 커뮤니티 소속 팀 목록 보기
const getCommunityTeam = async (req,res,next) => {
    const {community_list_idx} = req.params
    const {page} = req.query

    try{
        const result = await client.query(getCommunityTeamSQL, [
            community_list_idx,
            page
        ])
        res.status(200).send({ participation_team : result.rows })
    } catch(e){
        next(e)
    }
}

// 커뮤니티 진행 대회 목록 보기
const getCommunityChampionship = async (req,res,next) => {
    const {community_list_idx} = req.params
    const {page} = req.query

    try{
        const result = await client.query(getCommunityChampionshipSQL, [
            community_list_idx,
            page
        ])
        res.status(200).send({ championship : result.rows })
    } catch(e){
        next(e)
    }
}

// 커뮤니티 공지 수정하기
const putCommunityNotice = async (req,res,next) => {
    const {community_list_idx} = req.params
    const {community_list_notice} = req.body

    try{
        await client.query(
            putCommunityNoticeSQL,
            [
                community_list_idx,
                community_list_notice
            ]
        );

        res.status(200).send({});
    } catch(e){
        next(e)
    }
} 


// 커뮤니티 엠블렘 수정
const putCommunityEmblem = async (req,res,next) => {
    const {community_list_idx} = req.params
    new_img_url = req.fileUrl;

    try{
        const { rows } = await client.query(
            `SELECT community_list_emblem FROM community.list WHERE community_list_idx = $1`,
            [community_list_idx]
        );

        const old_img_url = rows[0]?.community_list_emblem;

        // 2️⃣ 기존 엠블렘이 존재하면 삭제
        if (old_img_url) {
            await deleteFileFromS3(old_img_url);
        }

        // 3️⃣ 새로운 엠블렘 URL을 DB에 업데이트
        await client.query(
            `UPDATE community.list SET community_list_emblem = $2 WHERE community_list_idx = $1`,
            [community_list_idx, new_img_url]
        );

        res.status(200).send({});
    } catch(e){
        next(e)
    }
} 

// 커뮤니티 배너 수정
const putCommunityBanner = async (req, res, next) => {
    const { community_list_idx } = req.params;
    const new_img_url = req.fileUrl;

    try {
        // 1️⃣ 기존 배너 URL 가져오기
        const { rows } = await client.query(
            `SELECT community_list_banner FROM community.list WHERE community_list_idx = $1`,
            [community_list_idx]
        );

        const old_img_url = rows[0]?.community_list_banner;

        // 2️⃣ 기존 배너가 존재하면 삭제
        if (old_img_url) {
            await deleteFileFromS3(old_img_url);
        }

        // 3️⃣ 새로운 배너 URL을 DB에 업데이트
        await client.query(
            `UPDATE community.list SET community_list_banner = $2 WHERE community_list_idx = $1`,
            [community_list_idx, new_img_url]
        );

        res.status(200).send({});
    } catch (e) {
        next(e);
    }
};


// 대회 만들기
const postChampioship = async (req,res,next) => {
    const {community_list_idx} = req.params
    const {
        championship_type_idx,
        championship_list_name,
        championship_list_description,
        championship_list_color,
        championship_list_start_date,
        championship_list_end_date,
        participation_team_idxs,
        championship_award_name
    } = req.body

    const championship_list_throphy_img = req.fileUrls?.[0]; // 첫 번째 파일은 대회 트로피 이미지
    const awardThrophyImages = req.fileUrls?.slice(1) || []; // 나머지는 수상 항목 트로피 이미지

    const awardNames = Array.isArray(championship_award_name)
    ? championship_award_name
    : [championship_award_name];
    
    try{
        await client.query("BEGIN");

        // 대회 생성
        const championshipResult = await client.query(postChampioshipSQL, [
            community_list_idx,
            championship_type_idx,
            championship_list_name,
            championship_list_description,
            MATCH_TYPE.FULL,
            championship_list_throphy_img,
            championship_list_color,
            championship_list_start_date,
            championship_list_end_date,
            CHAMPIONSHIP_STATUS.ONGOING
        ])

        const championship_list_idx = championshipResult.rows[0].championship_list_idx;
        
        // 참가 팀 추가
        await client.query(postChampioshipParticipantTeamSQL, [
            championship_list_idx,
            participation_team_idxs,
        ])

        
        if (awardNames[0]) {
            await client.query(postChampioshipAwardSQL, [
              championship_list_idx,
              awardNames,
              awardThrophyImages,
            ]);
        }

        await client.query("COMMIT");

        res.status(200).send({ "championship_list_idx" : championship_list_idx})
    } catch(e){
        await client.query("ROLLBACK");
        await client.query(sequenceAutoIncrease)
        next(e)
    }
}

// 운영진 가입 승인
const communityStaffAccess = async (req,res,next) => {
    const {player_list_idx} = req.params
    const {my_community_list_idx} = req.decoded

    try{
        await client.query("BEGIN");

        await client.query(communityStaffAccessDenySQL, [
            my_community_list_idx,
            player_list_idx
        ])

        await client.query(communityStaffAccessSQL,[
            my_community_list_idx,
            player_list_idx,
            COMMUNITY_ROLE.STAFF
        ])

        await client.query("COMMIT");
        res.status(200).send({})
    } catch(e){
        await client.query("ROLLBACK");
        await client.query(sequenceAutoIncrease)
        next(e)
    }
}

// 운영진 가입 거절
const communityStaffAccessDeny = async (req,res,next) => {
    const {community_list_idx,player_list_idx} = req.params

    try{
        await client.query(communityStaffAccessDenySQL, [
            community_list_idx,
            player_list_idx
        ])
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

// 커뮤니티 운영진 추방
const kickCommunityStaff = async (req,res,next) => {
    const {player_list_idx} = req.params
    const {my_community_list_idx} = req.decoded

    try{
        await client.query(kickCommunityStaffSQL, [
            player_list_idx,
            my_community_list_idx
        ])
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

// 커뮤니티 운영진 가입 신청
const communityStaffApplication = async (req,res,next) => {
    const {community_list_idx} = req.params
    const {
        my_player_list_idx
    } = req.decoded

    try{
        await client.query(communityStaffApplicationSQL, [
            community_list_idx,
            my_player_list_idx
        ])
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

// 커뮤니티 운영진 가입 신청 목록 보기 
const getCommunityStaffApplication = async (req,res,next) => {
    const {community_list_idx} = req.params

    try{
        const result = await client.query(getCommunityStaffApplicationSQL, [
            community_list_idx
        ])
        res.status(200).send({ access_list : result.rows})
    } catch(e){
        next(e)
    }
}

// 커뮤니티 팀 가입 신청 목록 보기
const getCommunityTeamApplication = async (req,res,next) => {
    const {community_list_idx} = req.params

    try{
        const result = await client.query(getCommunityTeamApplicationSQL, [
            community_list_idx
        ])
        res.status(200).send({ team_list : result.rows })
    } catch(e){
        next(e)
    }
}

// 커뮤니티 팀 가입 신청
const communityTeamApplication = async (req,res,next) => {
    const {community_list_idx} = req.params
    const {my_team_list_idx} = req.decoded

    try{
        await client.query(communityTeamApplicationSQL, [
            community_list_idx,
            my_team_list_idx
        ])
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

// 커뮤니티 팀 가입 신청 승인
const communityTeamAccess = async (req,res,next) => {
    const {team_list_idx} = req.params
    const {my_community_list_idx} = req.decoded

    try{
        await client.query("BEGIN");
        await client.query(communityTeamAccessDenySQL, [
            my_community_list_idx,
            team_list_idx
        ])

        await client.query(communityTeamAccessSQL, [
            my_community_list_idx,
            team_list_idx
        ])

        await client.query("COMMIT");
        res.status(200).send({})
    } catch(e){
        await client.query("ROLLBACK");
        await client.query(sequenceAutoIncrease)
        next(e)
    }
}

// 커뮤니티 팀 가입 신청 거절
const communityTeamAccessDeny = async (req,res,next) => {
    const {team_list_idx} = req.params
    const {my_community_list_idx} = req.decoded

    try{
        await client.query(communityTeamAccessDenySQL, [
            my_community_list_idx,
            team_list_idx
        ])
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

// 커뮤니티 추방
const communityTeamKick = async (req,res,next) => {
    const {team_list_idx} = req.params
    const {my_community_list_idx} = req.decoded

    try{
        await client.query(communityTeamKickSQL, [
            my_community_list_idx,
            team_list_idx
        ])
        res.status(200).send({})
    } catch(e){
        next(e)
    }
}

module.exports = {
    getCommunityBoardList,
    // postCommunityBoard,
    getCommunity,
    getCommunityStaff,
    getCommunityTeam,
    getCommunityChampionship,
    putCommunityNotice,
    putCommunityEmblem,
    putCommunityBanner,
    postChampioship,
    communityStaffAccess,
    communityStaffAccessDeny,
    kickCommunityStaff,
    communityStaffApplication,
    getCommunityStaffApplication,
    getCommunityTeamApplication,
    communityTeamApplication,
    communityTeamAccess,
    communityTeamAccessDeny,
    communityTeamKick
}