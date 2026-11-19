-- 赛季排行防作弊与管理
-- cheat：本赛季用过测试兑换码，一旦标记不再取消；hidden：被管理员隐藏。两者任一为 1 时不出现在排行中
ALTER TABLE season_scores ADD COLUMN cheat INTEGER NOT NULL DEFAULT 0;
ALTER TABLE season_scores ADD COLUMN hidden INTEGER NOT NULL DEFAULT 0;

-- 玩家举报：同一举报人对同一赛季的同一玩家只保留一条，管理员处理后 resolved = 1
-- reason：score（积分异常）或 speed（速通用时异常）
CREATE TABLE IF NOT EXISTS season_reports (
  season      TEXT NOT NULL,
  target_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  resolved    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (season, target_id, reporter_id)
);
CREATE INDEX IF NOT EXISTS idx_season_reports_open ON season_reports(season, resolved);
