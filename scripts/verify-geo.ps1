# =============================================================================
# GEO/SEO 一键验证脚本
# 用法: .\scripts\verify-geo.ps1 [-BaseUrl http://localhost:3000]
# =============================================================================

param(
    [string]$BaseUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Continue"
$Pass = 0
$Fail = 0

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  GEO/SEO 验证脚本" -ForegroundColor Cyan
Write-Host "  目标: $BaseUrl" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

function Test-Url {
    param($Url, $Label, $Crawler = $false)
    $headers = @{}
    if ($Crawler) { $headers["User-Agent"] = "Mozilla/5.0 (compatible; Googlebot/2.1)" }
    try {
        $r = Invoke-WebRequest -Uri "$BaseUrl$Url" -Headers $headers -TimeoutSec 10 -UseBasicParsing
        return $r
    } catch {
        return $null
    }
}

# ── 1. SSR 中间件测试 ─────────────────────────────────────────────────

Write-Host "[1/6] SSR 中间件测试" -ForegroundColor Yellow

$pages = @(
    @{Url="/"; Name="首页"},
    @{Url="/shop"; Name="商城"},
    @{Url="/teams"; Name="球队页"},
    @{Url="/buying-guide"; Name="购买指南"},
    @{Url="/size-guide"; Name="尺码指南"},
    @{Url="/faq"; Name="FAQ"},
    @{Url="/about"; Name="关于"},
    @{Url="/news"; Name="新闻列表"}
)

foreach ($p in $pages) {
    $r = Test-Url -Url $p.Url -Crawler $true
    if ($r -and $r.Content -match "<h1") {
        Write-Host "  ✅ $($p.Name) ($($p.Url)) — SSR 渲染成功" -ForegroundColor Green
        $Pass++
    } else {
        Write-Host "  ❌ $($p.Name) ($($p.Url)) — 无渲染内容" -ForegroundColor Red
        $Fail++
    }
}

# ── 2. JSON-LD 结构化数据 ──────────────────────────────────────────────

Write-Host "`n[2/6] JSON-LD 结构化数据" -ForegroundColor Yellow

$r = Test-Url -Url "/" -Crawler $true
if ($r) {
    $ldCount = ([regex]::Matches($r.Content, 'application/ld\+json')).Count
    Write-Host "  首页 JSON-LD 块数: $ldCount (期望 ≥ 2)" -ForegroundColor $(if ($ldCount -ge 2) { "Green" } else { "Red" })
    if ($ldCount -ge 2) { $Pass++ } else { $Fail++ }

    $types = [regex]::Matches($r.Content, '"@type"\s*:\s*"([^"]+)"') | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
    Write-Host "  首页 Schema 类型: $($types -join ', ')" -ForegroundColor Cyan
}

$r = Test-Url -Url "/product/1" -Crawler $true
if ($r) {
    $ldCount = ([regex]::Matches($r.Content, 'application/ld\+json')).Count
    Write-Host "  产品页 JSON-LD 块数: $ldCount (期望 ≥ 4)" -ForegroundColor $(if ($ldCount -ge 4) { "Green" } else { "Red" })
    if ($ldCount -ge 4) { $Pass++ } else { $Fail++ }
}

# ── 3. Meta 标签完整性 ─────────────────────────────────────────────────

Write-Host "`n[3/6] Meta 标签检查" -ForegroundColor Yellow

$r = Test-Url -Url "/buying-guide" -Crawler $true
if ($r) {
    $checks = @(
        @{Name="og:title"; Pattern='<meta property="og:title"'},
        @{Name="og:description"; Pattern='<meta property="og:description"'},
        @{Name="og:url"; Pattern='<meta property="og:url"'},
        @{Name="twitter:card"; Pattern='<meta name="twitter:card"'},
        @{Name="canonical"; Pattern='<link rel="canonical"'},
        @{Name="description"; Pattern='<meta name="description"'}
    )
    foreach ($c in $checks) {
        if ($r.Content -match $c.Pattern) {
            Write-Host "  ✅ $($c.Name)" -ForegroundColor Green
            $Pass++
        } else {
            Write-Host "  ❌ $($c.Name) — 缺失" -ForegroundColor Red
            $Fail++
        }
    }
}

# ── 4. Sitemap ──────────────────────────────────────────────────────────

Write-Host "`n[4/6] Sitemap 检查" -ForegroundColor Yellow

$r = Test-Url -Url "/sitemap.xml"
if ($r) {
    $urlCount = ([regex]::Matches($r.Content, '<loc>')).Count
    Write-Host "  Sitemap URL 总数: $urlCount (期望 ≥ 50)" -ForegroundColor $(if ($urlCount -ge 50) { "Green" } else { "Red" })
    if ($urlCount -ge 50) { $Pass++ } else { $Fail++ }

    # 检查是否包含关键 URL
    $keyUrls = @("/buying-guide", "/size-guide", "/news", "/product/")
    foreach ($u in $keyUrls) {
        if ($r.Content -match $u) {
            Write-Host "  ✅ Sitemap 包含: $u" -ForegroundColor Green
            $Pass++
        } else {
            Write-Host "  ⚠️  Sitemap 缺失: $u" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "  ❌ Sitemap 无法访问" -ForegroundColor Red
    $Fail++
}

# ── 5. Robots.txt ───────────────────────────────────────────────────────

Write-Host "`n[5/6] Robots.txt 检查" -ForegroundColor Yellow

$r = Test-Url -Url "/robots.txt"
if ($r) {
    if ($r.Content -match "Sitemap") {
        Write-Host "  ✅ Robots.txt 含 Sitemap 引用" -ForegroundColor Green
        $Pass++
    } else {
        Write-Host "  ⚠️  Robots.txt 缺少 Sitemap" -ForegroundColor Yellow
    }
    if ($r.Content -match "Disallow: /admin") {
        Write-Host "  ✅ /admin 已屏蔽" -ForegroundColor Green
        $Pass++
    }
} else {
    Write-Host "  ❌ Robots.txt 无法访问" -ForegroundColor Red
    $Fail++
}

# ── 6. 响应头检查 ───────────────────────────────────────────────────────

Write-Host "`n[6/6] 爬虫响应头" -ForegroundColor Yellow

try {
    $r = Invoke-WebRequest -Uri "$BaseUrl/" -Headers @{"User-Agent"="Googlebot"} -TimeoutSec 10 -UseBasicParsing
    $ssrHeader = $r.Headers["X-Render-Mode"]
    if ($ssrHeader -eq "ssr-bot") {
        Write-Host "  ✅ X-Render-Mode: ssr-bot — SSR 中间件生效" -ForegroundColor Green
        $Pass++
    } else {
        Write-Host "  ⚠️  缺少 X-Render-Mode 头 — SSR 可能未命中" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ 无法获取响应头" -ForegroundColor Red
    $Fail++
}

# ── 汇总 ────────────────────────────────────────────────────────────────

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  验证结果" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  通过: $Pass" -ForegroundColor Green
Write-Host "  失败: $Fail" -ForegroundColor $(if ($Fail -gt 0) { "Red" } else { "Green" })

if ($Fail -eq 0) {
    Write-Host "`n  🎉 全部通过！可以部署了。" -ForegroundColor Green
} else {
    Write-Host "`n  ⚠️  有 $Fail 项未通过，请检查后重新验证。" -ForegroundColor Yellow
}

Write-Host "`n  下一步: 部署后提交到 Google Search Console" -ForegroundColor Cyan
Write-Host "  参考: docs/gsc-setup.md + docs/geo-monitoring-guide.md" -ForegroundColor Cyan
Write-Host ""
