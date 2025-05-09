-- 확장 기능 추가 (중복 제약조건 EXCLUDE 위해 필요)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- SCHEMA 생성
CREATE SCHEMA IF NOT EXISTS player;
CREATE SCHEMA IF NOT EXISTS team;
CREATE SCHEMA IF NOT EXISTS match;
CREATE SCHEMA IF NOT EXISTS board;
CREATE SCHEMA IF NOT EXISTS community;
CREATE SCHEMA IF NOT EXISTS championship;
CREATE SCHEMA IF NOT EXISTS common;

-- ENUM 타입
CREATE TYPE player_status AS ENUM ('pending', 'active', 'deleted');
-- pending : 로그인/회원가입만 한 계정 (공통 회원가입 X)
-- active : 정상 계정
-- deleted : 삭제 계정 (일정 기간 후 삭제 대상)

CREATE TYPE platform AS ENUM ('pc', 'xbox', 'playstation');

-- common
CREATE TABLE common.status (
  common_status_idx SERIAL PRIMARY KEY,
  common_status_name VARCHAR(20) UNIQUE NOT NULL
);

-- team
CREATE TABLE team.role (
  team_role_idx SERIAL PRIMARY KEY,
  team_role_name VARCHAR(10) UNIQUE NOT NULL
);

CREATE TABLE team.list (
  team_list_idx SERIAL PRIMARY KEY,
  team_list_name VARCHAR(20) UNIQUE NOT NULL,
  team_list_short_name VARCHAR(3) UNIQUE NOT NULL,
  team_list_color VARCHAR(7) NOT NULL,
  team_list_emblem TEXT,
  team_list_banner TEXT,
  team_list_announcement TEXT CHECK (char_length(team_list_announcement) <= 500),
  common_status_idx INT NOT NULL REFERENCES common.status(common_status_idx),
  team_list_created_at TIMESTAMP DEFAULT now(),
  team_list_updated_at TIMESTAMP DEFAULT now()
);

-- player
CREATE TABLE player.list (
    player_list_idx SERIAL PRIMARY KEY,
    player_list_phone VARCHAR(15) UNIQUE,
    player_list_id VARCHAR(20) UNIQUE,
    player_list_password VARCHAR(255),
    player_list_discord_id VARCHAR(255) UNIQUE,
    player_list_name VARCHAR(10) UNIQUE,
    player_list_nickname VARCHAR(10) UNIQUE,
    player_list_refreshtoken VARCHAR(255),
    player_list_refreshtoken_expires_at TIMESTAMP,
    player_list_profile_image TEXT,
    player_list_platform platform,
    player_list_state INT,
    player_list_message VARCHAR(50),
    player_list_MMR INT NOT NULL DEFAULT 0,  -- MMR: 기본값 0, NOT NULL로 설정
    player_list_discord_tag VARCHAR(40),
    player_list_player_status player_status,
    player_list_pending_at TIMESTAMP DEFAULT now(),
    player_list_active_at TIMESTAMP,
    player_list_deleted_at TIMESTAMP,
    match_position_idx INT NOT NULL DEFAULT 0 REFERENCES match.position(match_position_idx),
    FOREIGN KEY (player_list_state) REFERENCES common.status(common_status_idx),
    CONSTRAINT id_or_discord_id_not_null CHECK (
        player_list_id IS NOT NULL OR player_list_discord_id IS NOT NULL
    )
);

-- team continued
CREATE TABLE team.waitlist (
  team_waitlist_idx SERIAL PRIMARY KEY,
  team_list_idx INT NOT NULL REFERENCES team.list(team_list_idx) ON DELETE CASCADE,
  player_list_idx INT NOT NULL REFERENCES player.list(player_list_idx) ON DELETE CASCADE,
  team_waitlist_created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE team.member (
  team_list_idx INT NOT NULL REFERENCES team.list(team_list_idx) ON DELETE CASCADE,
  player_list_idx INT UNIQUE NOT NULL REFERENCES player.list(player_list_idx) ON DELETE CASCADE,
  team_role_idx INT NOT NULL REFERENCES team.role(team_role_idx),
  team_member_joined_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (team_list_idx, player_list_idx)
);

CREATE TABLE team.history (
  team_history_idx SERIAL PRIMARY KEY,
  team_list_idx INT,
  team_list_name VARCHAR(20) NOT NULL,
  team_history_created_at TIMESTAMP DEFAULT now()
);

-- match
CREATE TABLE match.type (
  match_type_idx SERIAL PRIMARY KEY,
  match_type_name VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE match.position (
  match_position_idx SERIAL PRIMARY KEY,
  match_position_name VARCHAR(5) UNIQUE NOT NULL
);

CREATE TABLE match.formation (
  match_formation_idx SERIAL PRIMARY KEY,
  match_formation_name VARCHAR(20) UNIQUE NOT NULL,
  match_type_idx INT NOT NULL REFERENCES match.type(match_type_idx) ON DELETE CASCADE,
  match_position_idxs INT[] NOT NULL
);

CREATE TABLE match.match (
  match_match_idx SERIAL PRIMARY KEY,
  team_list_idx INT REFERENCES team.list(team_list_idx),
  player_list_idx INT REFERENCES player.list(player_list_idx) ON DELETE CASCADE,
  match_formation_idx INT NOT NULL REFERENCES match.formation(match_formation_idx),
  match_match_participation_type INT NOT NULL,
  match_type_idx INT NOT NULL REFERENCES match.type(match_type_idx),
  match_match_attribute INT NOT NULL DEFAULT 0,
  common_status_idx INT NOT NULL REFERENCES common.status(common_status_idx) DEFAULT 0,
  match_match_created_at TIMESTAMP DEFAULT now(),
  match_match_start_time TIMESTAMP NOT NULL,
  match_match_duration INTERVAL NOT NULL CHECK (match_match_duration > '0 seconds')
);

CREATE TABLE match.team_stats (
  match_team_stats_idx SERIAL PRIMARY KEY,
  match_match_idx INT NOT NULL REFERENCES match.match(match_match_idx) ON DELETE CASCADE,
  team_list_idx INT,
  team_list_name VARCHAR(20) NOT NULL,
  match_team_stats_our_score INT NOT NULL CHECK (match_team_stats_our_score >= 0),
  match_team_stats_other_score INT NOT NULL CHECK (match_team_stats_other_score >= 0),
  match_team_stats_possession FLOAT NOT NULL CHECK (match_team_stats_possession BETWEEN 0 AND 100),
  match_team_stats_total_shot INT NOT NULL CHECK (match_team_stats_total_shot >= 0),
  match_team_stats_expected_goal FLOAT NOT NULL CHECK (match_team_stats_expected_goal >= 0),
  match_team_stats_total_pass INT NOT NULL CHECK (match_team_stats_total_pass >= 0),
  match_team_stats_total_tackle INT NOT NULL CHECK (match_team_stats_total_tackle >= 0),
  match_team_stats_success_tackle INT NOT NULL CHECK (match_team_stats_success_tackle >= 0),
  match_team_stats_saved INT NOT NULL CHECK (match_team_stats_saved >= 0),
  match_team_stats_cornerkick INT NOT NULL CHECK (match_team_stats_cornerkick >= 0),
  match_team_stats_freekick INT NOT NULL CHECK (match_team_stats_freekick >= 0),
  match_team_stats_penaltykick INT NOT NULL CHECK (match_team_stats_penaltykick >= 0),
  match_team_stats_evidence_img TEXT NOT NULL
);

CREATE TABLE match.player_stats (
  match_player_stats_idx SERIAL PRIMARY KEY,
  match_match_idx INT NOT NULL REFERENCES match.match(match_match_idx) ON DELETE CASCADE,
  player_list_idx INT REFERENCES player.list(player_list_idx),
  player_list_nickname VARCHAR(10) NOT NULL,
  match_player_stats_goal INT NOT NULL CHECK (match_player_stats_goal >= 0),
  match_player_stats_assist INT NOT NULL CHECK (match_player_stats_assist >= 0),
  match_player_stats_successrate_pass FLOAT NOT NULL CHECK (match_player_stats_successrate_pass BETWEEN 0 AND 100),
  match_player_stats_successrate_dribble FLOAT NOT NULL CHECK (match_player_stats_successrate_dribble BETWEEN 0 AND 100),
  match_player_stats_successrate_tackle FLOAT NOT NULL CHECK (match_player_stats_successrate_tackle BETWEEN 0 AND 100),
  match_player_stats_possession FLOAT NOT NULL CHECK (match_player_stats_possession BETWEEN 0 AND 100),
  match_player_stats_standing_tackle INT NOT NULL CHECK (match_player_stats_standing_tackle >= 0),
  match_player_stats_sliding_tackle INT NOT NULL CHECK (match_player_stats_sliding_tackle >= 0),
  match_player_stats_cutting INT NOT NULL CHECK (match_player_stats_cutting >= 0),
  match_player_stats_saved INT NOT NULL CHECK (match_player_stats_saved >= 0),
  match_player_stats_successrate_saved FLOAT NOT NULL CHECK (match_player_stats_successrate_saved BETWEEN 0 AND 100),
  match_player_stats_evidence_img TEXT NOT NULL
);

CREATE TABLE match.mom (
  match_mom_idx SERIAL PRIMARY KEY,
  match_team_stats_idx INT NOT NULL REFERENCES match.team_stats(match_team_stats_idx) ON DELETE CASCADE,
  match_match_idx INT NOT NULL UNIQUE REFERENCES match.match(match_match_idx) ON DELETE CASCADE,
  player_list_idx INT REFERENCES player.list(player_list_idx) ON DELETE SET NULL,
  player_list_nickname VARCHAR(10) NOT NULL
);

CREATE TABLE match.participant (
  match_participant_idx SERIAL PRIMARY KEY,
  match_match_idx INT NOT NULL REFERENCES match.match(match_match_idx) ON DELETE CASCADE,
  player_list_idx INT REFERENCES player.list(player_list_idx) ON DELETE SET NULL,
  match_position_idx INT NOT NULL REFERENCES match.position(match_position_idx) ON DELETE CASCADE,
  player_list_nickname VARCHAR(50) NOT NULL,
  match_time_range TSTZRANGE NOT NULL,
  CONSTRAINT participant_unique_match_player UNIQUE (match_match_idx, player_list_idx),
  CONSTRAINT unique_participation_time 
    EXCLUDE USING GIST (
      player_list_idx WITH =,
      match_time_range WITH &&
    ) WHERE (player_list_idx IS NOT NULL)
);

CREATE TABLE match.waitlist (
  match_waitlist_idx SERIAL PRIMARY KEY,
  match_match_idx INT NOT NULL REFERENCES match.match(match_match_idx) ON DELETE CASCADE,
  player_list_idx INT NOT NULL REFERENCES player.list(player_list_idx) ON DELETE CASCADE,
  match_position_idx INT NOT NULL REFERENCES match.position(match_position_idx) ON DELETE CASCADE,
  match_waitlist_created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT unique_match_waitlist UNIQUE (match_match_idx, match_position_idx, player_list_idx)
);

-- community
CREATE TABLE community.list (
  community_list_idx SERIAL PRIMARY KEY,
  community_list_name VARCHAR(20) UNIQUE NOT NULL,
  community_list_notice TEXT,
  community_list_banner TEXT,
  community_list_emblem TEXT,
  community_list_created_at TIMESTAMP DEFAULT now(),
  community_list_updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE community.role (
  community_role_idx SERIAL PRIMARY KEY,
  community_role_name VARCHAR(10) UNIQUE NOT NULL
);

CREATE TABLE community.waitlist (
  community_list_idx INT NOT NULL REFERENCES community.list(community_list_idx) ON DELETE CASCADE,
  player_list_idx INT NOT NULL REFERENCES player.list(player_list_idx) ON DELETE CASCADE,
  community_waitlist_created_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (community_list_idx, player_list_idx)
);

CREATE TABLE community.staff (
  community_list_idx INT NOT NULL REFERENCES community.list(community_list_idx) ON DELETE CASCADE,
  player_list_idx INT UNIQUE NOT NULL REFERENCES player.list(player_list_idx) ON DELETE CASCADE,
  community_role_idx INT NOT NULL REFERENCES community.role(community_role_idx) ON DELETE CASCADE,
  community_staff_joined_at TIMESTAMP DEFAULT now()
);

CREATE TABLE community.team (
  community_list_idx INT NOT NULL REFERENCES community.list(community_list_idx),
  team_list_idx INT NOT NULL REFERENCES team.list(team_list_idx) ON DELETE CASCADE,
  community_team_joined_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (community_list_idx, team_list_idx)
);

CREATE TABLE community.team_waitlist (
  team_waitlist_idx SERIAL PRIMARY KEY,
  community_list_idx INT NOT NULL REFERENCES community.list(community_list_idx) ON DELETE CASCADE,
  team_list_idx INT NOT NULL REFERENCES team.list(team_list_idx) ON DELETE CASCADE,
  team_waitlist_created_at TIMESTAMP DEFAULT now(),
  UNIQUE (community_list_idx, team_list_idx)
);

-- championship
CREATE TABLE championship.type (
  championship_type_idx SERIAL PRIMARY KEY,
  championship_type_name VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE championship.list (
  championship_list_idx SERIAL PRIMARY KEY,
  community_list_idx INT NOT NULL REFERENCES community.list(community_list_idx),
  championship_type_idx INT NOT NULL REFERENCES championship.type(championship_type_idx),
  championship_list_name VARCHAR(30) UNIQUE NOT NULL,
  championship_list_description TEXT,
  match_type_idx INT NOT NULL REFERENCES match.type(match_type_idx),
  championship_list_throphy_img TEXT NOT NULL,
  championship_list_start_date DATE NOT NULL,
  championship_list_end_date DATE NOT NULL,
  championship_list_created_at TIMESTAMP DEFAULT now(),
  common_status_idx INT NOT NULL REFERENCES common.status(common_status_idx),
  championship_list_color VARCHAR(7) NOT NULL
);

CREATE TABLE championship.participation_team (
  participation_team_idx SERIAL PRIMARY KEY,
  championship_list_idx INT NOT NULL REFERENCES championship.list(championship_list_idx) ON DELETE CASCADE,
  team_list_idx INT REFERENCES team.list(team_list_idx),
  team_list_name VARCHAR(20) NOT NULL
);

CREATE TABLE championship.award (
    championship_award_idx SERIAL PRIMARY KEY,
    championship_list_idx INT NOT NULL REFERENCES championship.list(championship_list_idx) ON DELETE CASCADE,
    championship_award_name VARCHAR(50) NOT NULL,
    championship_award_throphy_image TEXT  -- 트로피 이미지 URL 저장용 컬럼
);

CREATE TABLE championship.award_winner (
  championship_award_winner_idx SERIAL PRIMARY KEY,
  championship_list_idx INT NOT NULL REFERENCES championship.list(championship_list_idx) ON DELETE CASCADE,
  championship_award_idx INT NOT NULL REFERENCES championship.award(championship_award_idx) ON DELETE CASCADE,
  player_list_idx INT REFERENCES player.list(player_list_idx),
  championship_award_winner_player_nickname VARCHAR(10) NOT NULL
);

CREATE TABLE championship.winner (
  championship_winner_idx SERIAL PRIMARY KEY,
  championship_list_idx INT NOT NULL REFERENCES championship.list(championship_list_idx) ON DELETE CASCADE,
  team_list_idx INT REFERENCES team.list(team_list_idx),
  championship_winner_team_name VARCHAR(20) NOT NULL
);

CREATE TABLE championship.championship_match (
  championship_match_idx SERIAL PRIMARY KEY,
  championship_list_idx INT NOT NULL REFERENCES championship.list(championship_list_idx) ON DELETE CASCADE,
  championship_match_first_idx INT NULL,
  championship_match_second_idx INT NULL,
  match_match_start_time TIMESTAMP NOT NULL,
  match_match_duration INTERVAL NOT NULL CHECK (match_match_duration > '0 seconds')
);

-- board
CREATE TABLE board.category (
  board_category_idx SERIAL PRIMARY KEY,
  board_category_name VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE board.list (
  board_list_idx SERIAL PRIMARY KEY,
  board_category_idx INT NOT NULL REFERENCES board.category(board_category_idx),
  board_list_title VARCHAR(50) NOT NULL,
  board_list_content TEXT,
  player_list_idx INT NOT NULL REFERENCES player.list(player_list_idx) ON DELETE CASCADE,
  community_list_idx INT REFERENCES community.list(community_list_idx) ON DELETE CASCADE,
  team_list_idx INT REFERENCES team.list(team_list_idx) ON DELETE CASCADE,
  board_list_img JSONB,
  board_list_created_at TIMESTAMP DEFAULT now(),
  board_list_updated_at TIMESTAMP DEFAULT now(),
  board_list_likecount INT DEFAULT 0 CHECK (board_list_likecount >= 0) NOT NULL,
  board_list_view_count INT DEFAULT 0 CHECK (board_list_view_count >= 0) NOT NULL
);

CREATE TABLE board.comment (
  board_comment_idx SERIAL PRIMARY KEY,
  board_list_idx INT NOT NULL REFERENCES board.list(board_list_idx) ON DELETE CASCADE,
  player_list_idx INT NOT NULL REFERENCES player.list(player_list_idx) ON DELETE CASCADE,
  board_comment_content VARCHAR(100) NOT NULL,
  board_comment_created_at TIMESTAMP DEFAULT now(),
  board_comment_updated_at TIMESTAMP DEFAULT now()
);


