#!/usr/bin/env node

/**
 * 通用博客文章量化评分脚本
 *
 * 用法: node article-scorer.js --profile <name> <file_path>
 * 示例: node article-scorer.js --profile official-doc source/_posts/.../hooks.md
 *
 * 从 YAML 配置文件加载评分标准，内置可插拔检查器，输出 JSON 评分报告。
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ── 参数解析 ──────────────────────────────────────────

function parseArgs(args) {
  const result = { profile: null, file: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--profile' && args[i + 1]) {
      result.profile = args[++i];
    } else if (!args[i].startsWith('--')) {
      result.file = args[i];
    }
  }
  return result;
}

// ── 配置加载 ──────────────────────────────────────────

function loadProfile(profileName) {
  const profilePath = path.join(__dirname, 'profiles', `${profileName}.yaml`);
  if (!fs.existsSync(profilePath)) {
    console.error(`配置文件不存在: ${profilePath}`);
    process.exit(1);
  }
  return yaml.load(fs.readFileSync(profilePath, 'utf-8'));
}

// ── 文章解析 ──────────────────────────────────────────

function parseArticle(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  // 只匹配开头且中间内容至少有一行 key: value 的 front matter
  const fmMatch = raw.match(/^---\n([\s\S]*?\n\w[\w_-]*:\s*\S[\s\S]*?)\n---\n/);
  const frontMatter = fmMatch ? fmMatch[1] : '';
  const body = fmMatch ? raw.slice(fmMatch[0].length) : raw;
  return { raw, frontMatter, body };
}

function parseFrontMatterFields(fmText) {
  const fields = new Set();
  for (const line of fmText.split('\n')) {
    // 匹配 key: value 或 key: (空值/数组/对象的开始)
    const m = line.match(/^(\w[\w_-]*):/);
    if (m) fields.add(m[1]);
  }
  return fields;
}

// ── 内置检查器 ──────────────────────────────────────────

const checkers = {
  /**
   * 正则匹配计数
   * 参数: pattern, threshold, operator(默认 ">=")
   */
  regex_count(body, check) {
    const re = new RegExp(check.pattern, 'g');
    const matches = body.match(re) || [];
    const count = matches.length;
    const op = check.operator || '>=';
    const pass = compare(count, check.threshold, op);
    return { count, pass, score: pass ? check.score : 0, details: `找到 ${count} 处匹配` };
  },

  /**
   * 代码块按语言统计
   * 参数: languages(数组), threshold
   */
  code_lang_count(body, check) {
    const codeBlockRe = /```(\w+)\n[\s\S]*?```/g;
    const langCounts = {};
    let m;
    while ((m = codeBlockRe.exec(body)) !== null) {
      const lang = m[1].toLowerCase();
      langCounts[lang] = (langCounts[lang] || 0) + 1;
    }
    const langs = check.languages || [];
    let count = 0;
    const found = {};
    for (const lang of langs) {
      if (langCounts[lang]) {
        count += langCounts[lang];
        found[lang] = langCounts[lang];
      }
    }
    const pass = count >= check.threshold;
    const detailParts = Object.entries(found).map(([l, c]) => `${l}:${c}`);
    return {
      count,
      pass,
      score: pass ? check.score : 0,
      details: detailParts.length ? `找到配置示例(${detailParts.join(', ')})` : '未找到配置示例'
    };
  },

  /**
   * 中文字符计数
   * 参数: threshold
   */
  chinese_char_count(body, check) {
    const matches = body.match(/[\u4e00-\u9fa5]/g) || [];
    const count = matches.length;
    const pass = count >= check.threshold;
    return { count, pass, score: pass ? check.score : 0, details: `中文字数 ${count}` };
  },

  /**
   * 黑名单词组检测
   * 参数: patterns(正则数组), threshold, operator(默认 "<=")
   */
  blacklist(body, check) {
    const matches = [];
    for (const p of (check.patterns || [])) {
      const re = new RegExp(p, 'g');
      const hits = body.match(re);
      if (hits) {
        matches.push(...hits);
      }
    }
    const count = matches.length;
    const op = check.operator || '<=';
    const pass = compare(count, check.threshold, op);
    return {
      count,
      pass,
      score: pass ? check.score : 0,
      details: pass ? '未检测到空话' : `检测到 ${count} 处空话: ${matches.slice(0, 5).join(', ')}`,
      matches
    };
  },

  /**
   * Front Matter 字段完整性检查
   * 参数: required_fields(数组), threshold
   */
  front_matter(_body, check, parsed) {
    const fields = parseFrontMatterFields(parsed.frontMatter);
    const required = check.required_fields || [];
    const missing = required.filter(f => !fields.has(f));
    const count = required.length - missing.length;
    const pass = count >= (check.threshold || required.length);
    return {
      count,
      pass,
      score: pass ? check.score : 0,
      details: pass ? 'Front Matter 完整' : `缺少字段: ${missing.join(', ')}`,
      missing
    };
  }
};

function compare(value, threshold, operator) {
  switch (operator) {
    case '>=': return value >= threshold;
    case '<=': return value <= threshold;
    case '>': return value > threshold;
    case '<': return value < threshold;
    case '==': return value === threshold;
    default: return value >= threshold;
  }
}

// ── 主流程 ──────────────────────────────────────────

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.profile || !args.file) {
    console.error('用法: node article-scorer.js --profile <name> <file_path>');
    process.exit(1);
  }

  const filePath = path.resolve(args.file);
  if (!fs.existsSync(filePath)) {
    console.error(`文件不存在: ${filePath}`);
    process.exit(1);
  }

  const profile = loadProfile(args.profile);
  const parsed = parseArticle(filePath);
  const quantConfig = profile.quantitative || {};

  // 执行所有量化检查
  const scores = {};
  let totalScore = 0;
  let maxScore = 0;

  for (const check of (quantConfig.checks || [])) {
    const checkerFn = checkers[check.checker];
    if (!checkerFn) {
      console.error(`未知检查器: ${check.checker}`);
      continue;
    }
    const result = checkerFn(parsed.body, check, parsed);
    scores[check.id] = {
      name: check.name,
      count: result.count,
      pass: result.pass,
      score: result.score,
      details: result.details
    };
    if (result.matches) scores[check.id].matches = result.matches;
    if (result.missing) scores[check.id].missing = result.missing;
    totalScore += result.score;
    maxScore += check.score;
  }

  // 归一化到 0-100
  const normalizedTotal = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  const report = {
    profile: args.profile,
    file: filePath,
    timestamp: new Date().toISOString(),
    scores,
    total: normalizedTotal,
    maxPossible: 100,
    pass: normalizedTotal >= (profile.pass?.threshold || 70)
  };

  console.log(JSON.stringify(report, null, 2));
}

main();
