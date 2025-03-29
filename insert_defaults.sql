-- match.position
INSERT INTO match.position (match_position_idx, match_position_name) VALUES
(0, 'GK'), (1, 'RB'), (2, 'RCB'), (3, 'CB'), (4, 'LCB'), (5, 'LB'),
(6, 'RWB'), (7, 'RDM'), (8, 'CDM'), (9, 'LDM'), (10, 'LWB'),
(11, 'RM'), (12, 'RCM'), (13, 'CM'), (14, 'LCM'), (15, 'LM'),
(16, 'RAM'), (17, 'CAM'), (18, 'LAM'),
(19, 'RW'), (20, 'RS'), (21, 'ST'), (22, 'LS'), (23, 'LW');

-- match.formation
INSERT INTO match.formation (match_formation_idx, match_formation_name, match_type_idx, match_position_idxs) VALUES
(0, '4-3-3', 0, ARRAY[0, 1, 2, 4, 5, 8, 12, 14, 19, 21, 23]),
(1, '4-4-2', 0, ARRAY[0, 1, 2, 4, 5, 11, 12, 13, 15, 20, 22]),
(2, '4-2-3-1', 0, ARRAY[0, 1, 2, 4, 5, 7, 9, 16, 17, 18, 21]),
(3, '3-4-3', 0, ARRAY[0, 2, 3, 4, 11, 12, 14, 15, 19, 21, 23]),
(4, '3-2-5', 0, ARRAY[0, 2, 3, 4, 7, 9, 16, 18, 19, 21, 23]),
(5, 'RUSH', 1, ARRAY[3, 21, 11, 15]);

-- match.type
INSERT INTO match.type (match_type_idx, match_type_name) VALUES
(0, '11:11'), (1, '4:4 ( RUSH )');

-- common.status
INSERT INTO common.status (common_status_idx, common_status_name) VALUES
(0, '매치 라인업 마감 전'),
(1, '매치 라인업 마감'),
(2, '매치 스탯 입력 마감'),
(3, '대회 진행 중'),
(4, '대회 종료'),
(5, '팀원 모집 중'),
(6, '팀 구하는 중'),
(7, '공방 매치 참여 희망'),
(8, '무상태');

-- community.list
INSERT INTO community.list (community_list_idx, community_list_name) VALUES
(0, 'KFPL');

INSERT INTO community.role (community_role_idx, community_role_name)
VALUES
(0, '운영자'),
(1, '운영진');

-- team.role
INSERT INTO team.role (team_role_idx, team_role_name) VALUES
(0, '팀장'),
(1, '부팀장'),
(2, '팀원');

-- championship.type
INSERT INTO championship.type (championship_type_idx, championship_type_name) VALUES
(0, '리그'),
(1, '토너먼트 16강'),
(2, '토너먼트 8강'),
(3, '토너먼트 4강');

-- board.category
INSERT INTO board.category (board_category_idx, board_category_name) VALUES
(0, '자유게시판'),
(1, '커뮤니티 게시판');

