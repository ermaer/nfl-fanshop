# GEO / SEO 效果监控指南

优化做完后，效果看这 4 个地方：

---

## 第一层：部署前本地验证（5 分钟）

部署前运行这些命令，确保一切正常后再上线。

### 1.1 检查 SSR 是否生效

```bash
# 模拟 Googlebot 访问首页
curl -s -H "User-Agent: Mozilla/5.0 (compatible; Googlebot/2.1)" http://localhost:3000/ | head -50

# 应该看到:
#   <title>NFL Fan Shop – Team T-Shirts & Dresses for All 32 Teams</title>
#   <meta property="og:title" content="...">
#   <script type="application/ld+json">...</script>
#   <h1>NFL Fan Shop — Premium Team T-Shirts...</h1>    ← 有真实内容！
#   X-Render-Mode: ssr-bot                               ← 确认命中 SSR
```

对比普通用户访问（应该是空的 `<div id="root"></div>` + JS bundle）：

```bash
# 普通浏览器 UA
curl -s http://localhost:3000/ | grep "div id=\"root\""
# 输出: <div id="root"></div>     ← SPA 空壳
```

### 1.2 验证 JSON-LD 结构化数据

```bash
# 检查产品页的 JSON-LD
curl -s -H "User-Agent: Googlebot" http://localhost:3000/product/1 | grep -o '"@type"[^,]*' | head -5
# 应该输出:
#   "@type":"Organization"
#   "@type":"WebSite"
#   "@type":"Product"
#   "@type":"Offer"
#   "@type":"BreadcrumbList"
```

### 1.3 验证 Sitemap

```bash
# sitemap 是否包含所有 URL
curl -s http://localhost:3000/sitemap.xml | grep -c "<url>"
# 应该返回 ~100 个 URL
```

### 1.4 用 Google 官方工具验证

去 https://search.google.com/test/rich-results ，输入 `https://你的域名/product/1`，看：
- ✅ Product schema 识别
- ✅ AggregateRating 识别
- ✅ BreadcrumbList 识别

---

## 第二层：Google Search Console（部署后 1-7 天）

这是 **最重要的监控工具**，一切排名数据都从这里来。

### 2.1 首次设置（已完成文档）

按 [gsc-setup.md](gsc-setup.md) 步骤操作：
1. 域名验证
2. 提交 sitemap.xml
3. 等待数据（1-3 天开始出现，1 周后稳定）

### 2.2 关键指标 —— 每周看这 4 个页面

| 页面 | 看什么 | 期望 |
|------|--------|------|
| **效果 → 搜索效果** | 总点击次数、总展示次数、平均排名 | 从 0 开始，逐周上升 |
| **索引 → 页面** | 已编入索引的页面数 | 应该 ≥ 50 页 |
| **增强功能** | 结构化数据检测项 | 应该显示 Product/Breadcrumb/FAQ/Article |
| **网址检查** | 逐个 URL 排查 | 每个都应为"已编入索引" |

### 2.3 搜索查询关键词 —— GEO 效果的直接反映

在 **效果 → 查询** 中，看有哪些搜索词带来展示：

```text
高价值查询（期望出现）:
  - "nfl fan shop"                  ← 品牌词
  - "nfl t-shirt size chart"        ← Size Guide 页面
  - "best nfl fan gear 2026"        ← Buying Guide 页面
  - "cheap nfl team shirts"         ← Shop 页面
  - "nfl news 2026"                 ← News 页面
  - "dallas cowboys fan gear"       ← 队名 + gear
```

如果这些查询开始出现，说明 GEO 内容起效了。

---

## 第三层：AI 搜索引擎引用检测（GEO 核心）

这是 GEO 和传统 SEO 最大的区别——不看排名，看 AI 是否引用你。

### 3.1 ChatGPT Search

在 ChatGPT 中提问（需要 ChatGPT Plus，Search 模式）：

```
Q: "Where can I buy affordable NFL team t-shirts?"
Q: "What sizes do NFL fan t-shirts come in?"
Q: "Best NFL fan shop for all 32 teams"
Q: "NFL free agency 2026 biggest moves"
```

**期望结果**：ChatGPT 回答中包含来自你网站的信息或链接。

### 3.2 Perplexity AI

访问 https://perplexity.ai，提同样的问题。

Perplexity 的优势是它会**显示引用来源**，直接看到你的 URL 是否被引用。

### 3.3 Google AI Overview

在 Google 搜索以下问题（需要在支持 AI Overview 的地区，如美国 IP）：

```
- "NFL fan gear buying guide"
- "NFL t-shirt size chart XS to 3XL"
- "how much do NFL fan t-shirts cost"
```

如果看到 AI Overview 中有你的内容 → GEO 成功。

### 3.4 如何追踪 AI 引用率

目前没有自动化工具。手动方法：
1. 每月在 Perplexity 搜索 5 个核心查询词
2. 记录哪些查询中出现了你的网站
3. 查 GSC 的 `chatgpt-user` 和 `perplexitybot` 来源流量

在 GSC 中检查这些爬虫是否访问：
- 设置 → 抓取统计 → 查看 Googlebot/其他爬虫的访问频率
- 理想的标志：`GPTBot`, `ChatGPT-User`, `PerplexityBot` 出现在日志中

---

## 第四层：持续监控数据看板

### 4.1 每日 Cron 任务结果

已配置的 `GEO Content Freshness Update` 任务每天 03:00 运行。

每次运行后，可以在 Accio 工作区的 cron 日志中查看：
- 是否成功更新了时间戳
- 是否有错误

```bash
# 本地查看 cron 运行历史（部署后在 Accio 界面看）
cat .accio/cron/runs/cron-1784739342139-hjuz8eo2/*.jsonl | tail -5
```

### 4.2 周度检查清单

```markdown
☐ GSC 展示次数是否上升？目标：每周 +10-20%
☐ 新页面是否被索引？检查 Indexing → Pages
☐ 结构化数据是否有错误？检查 Enhancements
☐ Sitemap 状态是否正常？GSC → Sitemaps
☐ AI 引用率：在 Perplexity 搜索 5 个核心词
☐ Cron 定时任务是否正常执行？
☐ 核心页面加载速度？Chrome DevTools Lighthouse
```

### 4.3 月度对比看板

| 指标 | 第 1 月 | 第 2 月 | 第 3 月 |
|------|---------|---------|---------|
| 索引页面数 | 从 0 起步 | 预期 50+ | 预期 80+ |
| 日均展示次数 | 0→50 | 50→200 | 200→500 |
| 日均点击次数 | 0→3 | 3→15 | 15→40 |
| 结构化数据错误 | 检查 | 修复 | 0 错误 |
| AI 引用查询数 | 0→2 | 2→5 | 5→10 |

---

## 常见问题

### Q: 为什么部署后 GSC 没有立刻显示数据？

A: Google 抓取和索引需要时间。通常：
- 1-3 天：首次抓取
- 3-7 天：开始出现展示数据
- 2-4 周：排名趋于稳定
- 1-3 月：GEO 内容被 AI 引擎引用

### Q: 怎么知道 SSR 在正常工作？

A: 在 GSC → 设置 → 关于 → 抓取统计，查看 Googlebot 抓取的页面数。
如果 SSR 正常工作，Googlebot 应该能抓取到所有页面的内容。

或者用命令行验证：

```bash
curl -I -H "User-Agent: Googlebot" https://你的域名/product/1
# 看响应头: X-Render-Mode: ssr-bot  ← 这个头是我们加的
```

### Q: 我的网站是 SPA，Google 能正常索引吗？

A: 因为我们加了 SSR 中间件，Googlebot 收到的是完整 HTML（不是 SPA 空壳），所以索引应该没问题。但 Google 的渲染队列可能有延迟——首次抓取和首次渲染之间可能隔几天。
