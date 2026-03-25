#!/usr/bin/env node
/**
 * Hexo 博客截图验证脚本
 * 在文章/配置修改后自动启动服务器并截图验证
 */

const puppeteer = require('puppeteer');
const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const SCREENSHOT_DIR = path.join(PROJECT_DIR, '.claude-output', 'screenshots');
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

// 从文章文件解析 front matter 获取日期
function parseArticleDate(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontMatterMatch) return null;

    const frontMatter = frontMatterMatch[1];
    const dateMatch = frontMatter.match(/date:\s*(\d{4}-\d{2}-\d{2})/);
    return dateMatch ? dateMatch[1] : null;
  } catch {
    return null;
  }
}

// 构建文章 URL 和文章名
function buildArticleInfo(filePath) {
  // 匹配 source/_posts/ 后面的路径
  const match = filePath.match(/source\/_posts\/(.+)\.md$/);
  if (!match) return null;

  const slug = match[1]; // 例如: ai-tools/my-post
  const articleName = slug.split('/').pop(); // 取最后一段作为文章名

  // 从 front matter 获取日期
  const date = parseArticleDate(filePath);
  if (!date) {
    console.error(`[截图验证] 无法从文章获取日期，使用默认路径`);
    return { url: `${HEXO_URL}/${slug}/`, name: articleName };
  }

  // 构建 Hexo 默认的 URL 格式: /YYYY/MM/DD/slug/
  const [year, month, day] = date.split('-');
  return { url: `${HEXO_URL}/${year}/${month}/${day}/${slug}/`, name: articleName };
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const articlePath = args[0]; // 文章路径

  // 没有文章路径则不执行
  if (!articlePath || !fs.existsSync(articlePath)) {
    console.error(`[截图验证] 未提供有效文章路径，跳过`);
    process.exit(0);
  }

  console.error(`[截图验证] 开始执行...`);

  // 1. 确保服务器运行
  if (!isServerRunning()) {
    console.error(`[截图验证] 启动 Hexo server...`);
    await startServer();
    console.error(`[截图验证] Hexo server 已启动`);
  }

  // 2. 构建文章 URL 和名称
  const articleInfo = buildArticleInfo(articlePath);
  if (!articleInfo) {
    console.error(`[截图验证] 无法构建文章信息`);
    process.exit(0);
  }
  console.error(`[截图验证] 文章 URL: ${articleInfo.url}`);

  // 3. 只截图文章页
  const pages = [{ url: articleInfo.url, name: articleInfo.name }];

  // 4. 截图
  console.error(`[截图验证] 开始截图...`);
  const results = await takeScreenshots(pages);

  // 5. 输出截图路径（给 Claude 看）
  for (const r of results) {
    if (r.success) {
      console.log(`📸 截图已保存: ${r.screenshot}`);
    } else {
      console.error(`[截图验证] 截图失败: ${r.error}`);
    }
  }
}

main().catch(err => {
  console.error(`[截图验证] 错误: ${err.message}`);
  process.exit(1);
});
