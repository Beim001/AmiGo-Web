-- 全成就完成名次：玩家首次集齐全部成就时按先后编号，用于致谢名单「恭喜你成为第 X 名……」
CREATE TABLE IF NOT EXISTS completions (
  user_id      TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  rank         INTEGER NOT NULL UNIQUE,
  completed_at INTEGER NOT NULL
);
