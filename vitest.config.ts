import { defineConfig } from 'vitest/config';
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';

// 两组测试：web 在 happy-dom 中测试前端规则库（提供 localStorage）；worker 在 workerd 中测试后端接口，
// 每个测试文件开始前用 setup 文件把 worker/migrations 应用到独立的内存 D1。
export default defineConfig(async () => {
  const migrations = await readD1Migrations('worker/migrations');
  return {
    test: {
      projects: [
        {
          test: {
            name: 'web',
            include: ['src/**/*.test.ts'],
            environment: 'happy-dom',
            // 组件测试直接渲染使用 useTranslation 的组件，需要先初始化语言包
            setupFiles: ['./src/i18n/index.ts'],
          },
        },
        {
          plugins: [
            cloudflareTest({
              miniflare: {
                compatibilityDate: '2025-06-01',
                d1Databases: ['DB'],
                bindings: {
                  TEST_MIGRATIONS: migrations,
                  DEV_MODE: 'true',
                  ADMIN_EMAILS: 'admin@example.com',
                },
              },
            }),
          ],
          test: {
            name: 'worker',
            include: ['worker/test/**/*.test.ts'],
            setupFiles: ['./worker/test/apply-migrations.ts'],
          },
        },
      ],
    },
  };
});
