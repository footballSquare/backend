// 게시글 목록 가져오기
const getBoardListSQL =
`
SELECT 
    bl.board_list_idx,
    bl.board_category_idx,
    bl.board_list_title,
    bl.player_list_idx,
    bl.board_list_img,
    bl.board_list_created_at,
    bl.board_list_updated_at,
    bl.board_list_likecount,
    bl.board_list_view_count,
    bl.community_list_idx,
    pl.player_list_nickname,
    pl.player_list_profile_image
FROM board.list bl
LEFT JOIN player.list pl ON bl.player_list_idx = pl.player_list_idx
WHERE bl.board_category_idx = $1
ORDER BY bl.board_list_created_at DESC
LIMIT 10 OFFSET ($2 * 10);
`

// 조회수 증가
const increaseViewCountSQL = 
`
UPDATE board.list 
SET board_list_view_count = board_list_view_count + 1 
WHERE board_list_idx = $1;
`

// 게시글 상세 보기
const getBoardSQL =
`
WITH board_data AS (
    SELECT 
        bl.board_list_idx,
        bl.board_category_idx,
        bl.board_list_title,
        bl.board_list_content,
        bl.board_list_img,
        bl.board_list_created_at,
        bl.board_list_updated_at,
        bl.board_list_likecount,
        bl.board_list_view_count,
        bl.player_list_idx,
        pl.player_list_nickname,
        pl.player_list_profile_image
    FROM board.list bl
    JOIN player.list pl ON bl.player_list_idx = pl.player_list_idx
    WHERE bl.board_list_idx = $1
),
comment_data AS (
    SELECT 
        bc.board_comment_idx,
        bc.board_list_idx,
        bc.player_list_idx,
        bc.board_comment_content,
        bc.board_comment_created_at,
        bc.board_comment_updated_at,
        pl.player_list_nickname,
        pl.player_list_profile_image
    FROM board.comment bc
    JOIN player.list pl ON bc.player_list_idx = pl.player_list_idx
    WHERE bc.board_list_idx = $1
    ORDER BY bc.board_comment_created_at ASC
)
SELECT 
    jsonb_build_object(
        'board_list_idx', bd.board_list_idx,
        'board_category_idx', bd.board_category_idx,
        'board_list_title', bd.board_list_title,
        'board_list_content', bd.board_list_content,
        'board_list_img', bd.board_list_img,
        'board_list_created_at', bd.board_list_created_at,
        'board_list_updated_at', bd.board_list_updated_at,
        'board_list_likecount', bd.board_list_likecount,
        'board_list_view_count', bd.board_list_view_count,
        'player', jsonb_build_object(
            'player_list_idx', bd.player_list_idx,
            'player_list_nickname', bd.player_list_nickname,
            'player_list_profile_image', bd.player_list_profile_image
        ),
        'comments', COALESCE(jsonb_agg(
            jsonb_build_object(
                'board_comment_idx', cd.board_comment_idx,
                'player_list_idx', cd.player_list_idx,
                'player_list_nickname', cd.player_list_nickname,
                'player_list_profile_image', cd.player_list_profile_image,
                'board_comment_content', cd.board_comment_content,
                'board_comment_created_at', cd.board_comment_created_at,
                'board_comment_updated_at', cd.board_comment_updated_at
            )
        ) FILTER (WHERE cd.board_comment_idx IS NOT NULL), '[]')
    ) AS board
FROM board_data bd
LEFT JOIN comment_data cd ON bd.board_list_idx = cd.board_list_idx
GROUP BY bd.board_list_idx, bd.board_category_idx, bd.board_list_title, bd.board_list_content, 
         bd.board_list_img, bd.board_list_created_at, bd.board_list_updated_at, 
         bd.board_list_likecount, bd.board_list_view_count, bd.player_list_idx, 
         bd.player_list_nickname, bd.player_list_profile_image;
`

// 게시글 작성하기
const postBoardSQL = 
`
WITH community_info AS (
    SELECT community_list_idx 
    FROM community.staff
    WHERE player_list_idx = $4 
    LIMIT 1
)
INSERT INTO board.list (
    board_category_idx, 
    board_list_title, 
    board_list_content, 
    player_list_idx, 
    board_list_img, 
    board_list_created_at, 
    board_list_updated_at,
    community_list_idx
) VALUES (
    $1, $2, $3, $4, to_jsonb(array[$5]), now(), now(),
    CASE 
        WHEN $1 = 1 THEN (SELECT community_list_idx FROM community_info) 
        ELSE NULL 
    END
)
`

// 게시글 수정
const putBoardSQL = 
`
UPDATE board.list
SET 
    board_list_title = $2,
    board_list_content = $3,
    board_list_img = to_jsonb(array[$4]),
    board_list_updated_at = now()
WHERE board_list_idx = $1;
`

// 게시글 삭제
const deleteBoardSQL =
`
DELETE FROM board.list
WHERE board_list_idx = $1;
`

// 좋아요 증가
const likeIncreaseSQL = `
    UPDATE board.list 
    SET board_list_likecount = board_list_likecount + 1
    WHERE board_list_idx = $1;
`;

// 좋아요 추가
const boardLikeSQL = 
`
INSERT INTO board.like (
    board_list_idx, 
    player_list_idx
) VALUES (
    $1, $2
);
`;

// 좋아요 감소
const likeDecreaseSQL = 
`
UPDATE board.list
SET board_list_likecount = board_list_likecount - 1
WHERE board_list_idx = $1
AND board_list_likecount > 0;
`

// 좋아요 삭제
const boardLikeDeleteSQL = 
`
DELETE FROM board.like
WHERE board_list_idx = $1
AND player_list_idx = $2;
`

// 댓글 작성
const postCommentSQL = 
`
INSERT INTO board.comment (
    board_list_idx, 
    player_list_idx, 
    board_comment_content, 
    board_comment_created_at, 
    board_comment_updated_at
) VALUES (
    $1, $2, $3, now(), now()
);
`

// 댓글 수정하기
const putCommentSQL = 
`
UPDATE board.comment 
SET board_comment_content = $2, 
    board_comment_updated_at = NOW()
WHERE board_comment_idx = $1;
`

// 댓글 삭제하기
const deleteCommentSQL =
`
DELETE FROM board.comment 
WHERE board_comment_idx = $1;
`

module.exports = {
    getBoardListSQL,
    increaseViewCountSQL,
    getBoardSQL,
    postBoardSQL,
    putBoardSQL,
    deleteBoardSQL,
    likeIncreaseSQL,
    boardLikeSQL,
    likeDecreaseSQL,
    boardLikeDeleteSQL,
    postCommentSQL,
    putCommentSQL,
    deleteCommentSQL
}