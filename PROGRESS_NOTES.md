# 开发进度笔记（内部）

## 沙盒重置后的状态 (2026-07-22)
- 代码回到初始模板 (5ce81959)，需重建全部业务代码
- DB数据完好: teams 32行, products 64行且imageUrl已全部填充(混合两种格式: /manus-storage/generated/xxx.png 旧webdev生成 + /manus-storage/KEY_hash.png 新generate工具)
- 图像已全部生成/生成中(后台自动完成), 无需再管图片
- Stripe: 用户地区不支持自动沙盒, 需用户在 Settings → Payment 自行填密钥; 代码需处理 STRIPE_NOT_CONFIGURED
- 主题: 赛博朋克霓虹(深黑bg #05050a级, 霓虹粉 oklch(0.72 0.32 345), 电光青 oklch(0.85 0.15 195)), Orbitron/Rajdhani/Share Tech Mono字体, 工具类 neon-text-pink/cyan, neon-border-*, hud-corners, hud-line, font-mono-tech
- ThemeProvider defaultTheme=dark
- 尺码: XS,S,M,L,XL,XXL,3XL; T恤$34.99, 裙$59.99
- wouter patched版支持 useSearchParams
- stripe npm包需要重新安装 (pnpm add stripe)

## 重建进度 (更新于沙盒重置后)
已完成:
- todo.md, shared/teamsData.ts (32队), drizzle/schema.ts (与DB一致, 无需迁移)
- server/db.ts (全部query helpers), server/stripe.ts, server/stripeWebhook.ts
- server/_core/index.ts 已注册webhook (express.json之前)
- server/routers.ts 全部路由 (teams/products/cart/orders含Stripe checkout+syncStatus/admin含uploadImage)
- stripe npm包已安装, pnpm check通过
- client/index.html (Orbitron/Rajdhani/Share Tech Mono字体)
- client/src/index.css (赛博朋克dark主题+neon/hud工具类)
- client/src/lib/money.ts, components/ShopLayout.tsx, components/ProductCard.tsx
- pages/Home.tsx, pages/Teams.tsx, pages/Shop.tsx
- DB: products 64行imageUrl已全部填好, 无需再动
- 图片已全部提交生成(后台自动完成), 无需再管

待完成:
- pages/ProductDetail.tsx (写入失败重试中, Add File偶发失败, 重试即可)
- pages/Cart.tsx, Checkout.tsx, OrderSuccess.tsx, MyOrders.tsx
- pages/admin/AdminPage.tsx (含AdminProducts/AdminOrders/ProductFormDialog/AdminGuard, 可合成一个文件夹多文件)
- App.tsx 注册路由: / /teams /shop /product/:id /cart /checkout /order-success /orders /admin /admin/orders, ThemeProvider defaultTheme=dark
- vitest测试 (server/shop.test.ts)
- 截图验证 + checkpoint

关键实现细节:
- checkout mutation输入: shippingName/shippingPhone?/shippingAddress/origin(url), 返回 {orderId, checkoutUrl, error:'STRIPE_NOT_CONFIGURED'|null}
- orders.stripeStatus 查询返回 {configured:boolean}
- admin.uploadImage 输入{base64,fileName} 返回{url}
- SIZES = XS S M L XL XXL 3XL
- cart.get 返回 {item,product,team}[], products.list 返回 {product,team}[]
- Stripe未配置时Checkout页应提示去 Settings→Payment 配置
