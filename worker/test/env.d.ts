import type { D1Migration } from 'cloudflare:test';
import type { Env as WorkerEnv } from '../src/index';

// 测试环境的绑定：与线上 Worker 相同的 Env，外加 vitest.config.ts 注入的迁移列表
declare global {
  namespace Cloudflare {
    interface Env extends WorkerEnv {
      TEST_MIGRATIONS: D1Migration[];
    }
  }
}
