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

// 게시글 작성하기
const postBoardSQL = 
`
INSERT INTO board.list (
    board_category_idx, 
    board_list_title, 
    board_list_content, 
    player_list_idx, 
    board_list_img, 
    board_list_created_at, 
    board_list_updated_at
) VALUES (
    $1, $2, $3, $4, to_jsonb(array[$5]), now(), now()
)
`

module.exports = {
    getBoardListSQL,
    postBoardSQL
}