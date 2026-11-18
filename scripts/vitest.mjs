// npm test 的入口：修正 Windows 小写盘符后再启动 vitest。
// VS Code 等终端的工作目录可能是 c:\...（小写盘符），vitest 会把同一模块按大小写不同的两条路径各加载一次，
// 测试文件因此拿不到运行器（报 "Vitest failed to find the runner"）。vitest 启动时就会读取工作目录，
// 在配置文件里修正为时已晚，所以在这里先修正工作目录，再从该目录加载 vitest 的命令行入口。
// Windows 切换到只差大小写的同一路径时会保留原写法，因此先切到盘符根目录再切回。
import { join, parse } from 'node:path';
import { pathToFileURL } from 'node:url';

const cwd = process.cwd().replace(/^[a-z]:/, (drive) => drive.toUpperCase());
if (cwd !== process.cwd()) {
  process.chdir(parse(cwd).root);
  process.chdir(cwd);
}
await import(pathToFileURL(join(cwd, 'node_modules/vitest/vitest.mjs')).href);
