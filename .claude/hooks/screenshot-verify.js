#!/usr/bin/env node
/**
 * Hexo 博客截图验证脚本
 * 在文章/配置修改后自动启动服务器并截图验证
 */

const puppeteer = require('puppeteer');
const { exec, execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const SCREENSHOT_DIR = path.join(PROJECT_DIR, '.claude', 'screenshots');
const HEXO_PORT = 4000;
const HEXO_URL = `http://localhost:${HEXO_PORT}`;

// 确保截图目录存在
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// 检查 hexo server 是否在运行
function isServerRunning() {
  try {
    execSync(`curl -s -o /dev/null -w "%{http_code}" ${HEXO_URL}`, { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

// 启动 hexo server
async function startServer() {
  return new Promise((resolve, reject) => {
    const server = spawn('hexo', ['server'], {
      cwd: PROJECT_DIR,
      detached: true,
      stdio: 'ignore'
    });

    server.unref();

    // 等待服务器启动
    let attempts = 0;
    const maxAttempts = 30;

    const checkReady = setInterval(() => {
      attempts++;
      if (isServerRunning()) {
        clearInterval(checkReady);
        resolve();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkReady);
        reject(new Error('Hexo server 启动超时'));
      }
    }, 1000);
  });
}

// 截图函数
async function takeScreenshots(pages) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = [];

  for (const pageInfo of pages) {
    const { url, name } = pageInfo;
    const page = await browser.newPage();

    try {
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

      const filename = `${name}-${Date.now()}.png`;
      const filepath = path.join(SCREENSHOT_DIR, filename);
      await page.screenshot({ path: filepath, fullPage: false });

      results.push({
        page: name,
        url,
        screenshot: filepath,
        success: true
      });
    } catch (err) {
      results.push({
        page: name,
        url,
        error: err.message,
        success: false
      });
    }

    await page.close();
  }

  await browser.close();
  return results;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const articlePath = args[0]; // 可选：文章路径

  console.error(`[截图验证] 开始执行...`);

  // 1. 确保服务器运行
  if (!isServerRunning()) {
    console.error(`[截图验证] 启动 Hexo server...`);
    await startServer();
    console.error(`[截图验证] Hexo server 已启动`);
  }

  // 2. 构建要截图的页面列表
  const pages = [
    { url: `${HEXO_URL}/`, name: 'home' }
  ];

  // 如果有文章路径，添加文章页
  if (articlePath) {
    // 从文章路径提取 URL
    // 例如: source/_posts/ai-tools/my-post.md -> /2026/03/25/ai-tools/my-post/
    const match = articlePath.match(/source\/_posts\/(.+)\.md$/);
    if (match) {
      // 这里简化处理，实际需要从文章 front matter 获取日期
      // 暂时只截图首页
      console.error(`[截图验证] 文章路径: ${match[1]}`);
    }
  }

  // 3. 截图
  console.error(`[截图验证] 开始截图...`);
  const results = await takeScreenshots(pages);

  // 4. 输出结果（JSON 格式供 Hook 读取）
  const output = {
    timestamp: new Date().toISOString(),
    results,
    screenshotDir: SCREENSHOT_DIR
  };

  console.log(JSON.stringify(output, null, 2));

  // 5. 输出截图路径供 Claude 查看
  for (const r of results) {
    if (r.success) {
      console.error(`[截图验证] ${r.page}: ${r.screenshot}`);
    } else {
      console.error(`[截图验证] ${r.page} 失败: ${r.error}`);
    }
  }
}

main().catch(err => {
  console.error(`[截图验证] 错误: ${err.message}`);
  process.exit(1);
});
