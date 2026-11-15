-- 赛季成绩（第 55 题）：每个账号每个赛季一行
-- score：赛季积分（取最新上报值）；completed_ms：全成就用时（保留第一次集齐时的值）；lazy：本赛季用过简洁模式
CREATE TABLE IF NOT EXISTS season_scores (
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  season       TEXT NOT NULL,
  score        INTEGER NOT NULL DEFAULT 0,
  completed_ms INTEGER,
  lazy         INTEGER NOT NULL DEFAULT 0,
  updated_at   INTEGER NOT NULL,
  PRIMARY KEY (user_id, season)
);
CREATE INDEX IF NOT EXISTS idx_season_scores_score ON season_scores(season, score DESC);
CREATE INDEX IF NOT EXISTS idx_season_scores_speed ON season_scores(season, completed_ms);
