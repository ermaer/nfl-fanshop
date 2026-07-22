# Google Search Console 提交指南

## 前置条件
网站已部署到生产环境（https://nflfanshop.com 或实际域名）。

---

## 步骤 1：验证网站所有权

### 方法 A：HTML 文件验证（推荐）

Google 会给你一个 HTML 文件名，例如 `google-site-verification=xxxxxxxxx.html`。

1. 将文件内容放到 `client/public/` 目录下
2. 重新构建部署

### 方法 B：DNS TXT 记录验证

在域名 DNS 中添加 TXT 记录：
```
名称: @ (或留空)
值: google-site-verification=xxxxxxxxx
```

### 方法 C：HTML meta 标签验证

在 `client/index.html` 的 `<head>` 中添加：
```html
<meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" />
```

---

## 步骤 2：提交 Sitemap

验证通过后，在 GSC 中提交 Sitemap：

1. 进入 Google Search Console → 选择域名
2. 左侧菜单 → Sitemaps
3. 输入 `sitemap.xml` → 提交

Sitemap URL: `https://nflfanshop.com/sitemap.xml`

动态 sitemap 会自动包含：
- / — 首页 (priority 1.0)
- /shop — 商城 (priority 0.9)
- /teams — 球队页 (priority 0.8)
- /buying-guide — 购买指南 (priority 0.8)
- /size-guide — 尺码指南 (priority 0.7)
- /faq — FAQ (priority 0.6)
- /about — 关于 (priority 0.5)
- /shop?team={abbr} — 32 个球队筛选页
- /product/{id} — 64 个产品详情页

---

## 步骤 3：检查索引状态

提交后通常需要 1-7 天才能看到首批数据。关键指标：

1. **Coverage（覆盖率）**: 检查是否有错误页面
2. **Performance（效果）**: 查看搜索查询和排名
3. **Enhancements（增强功能）**: 验证 JSON-LD 结构化数据是否被识别
   - Product schema
   - BreadcrumbList schema
   - FAQ schema
   - Article schema

---

## 步骤 4：URL 检查工具

使用 GSC 的 URL Inspection Tool 测试以下关键页面：

```
https://nflfanshop.com/
https://nflfanshop.com/buying-guide
https://nflfanshop.com/size-guide
https://nflfanshop.com/shop
https://nflfanshop.com/product/1
```

检查要点：
- ✅ 页面状态: "URL is on Google"
- ✅ 索引编制: 允许
- ✅ 结构化数据: 已检测
- ✅ 移动设备易用性: 通过

---

## 步骤 5：定期重新提交

cron 任务 `GEO Content Freshness Update` 每天凌晨 3 点自动更新内容。
建议每月手动提交一次 sitemap 或在 GSC 中请求重新抓取关键页面。
