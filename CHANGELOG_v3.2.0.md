# WebLinuxOS v3.2.0 更新日志

## 发布日期
2026-06-20

## 概述

本次迭代聚焦于**安全审计、设计工具与代码质量**三个方向，新增 3 个高价值应用，对 README 进行结构化更新，并完成 GitHub Pages 部署校验。

## 新增应用

### 1. JWT 解码与验证（`jwt-decoder`）
- 完全在浏览器本地解析 JWT Token，Header / Payload / Signature 三段可视化
- 自动识别 `alg` 安全风险（如 `alg: none` 直接告警）
- 实时校验 `exp`（过期）、`nbf`（生效时间）、`iat`（签发时间）三大时间声明
- 使用相对时间格式（"3 小时后过期"），可读性强
- 彩色高亮的 JSON 视图，键/字符串/数字/布尔/Null 区分显示
- 适用场景：前后端联调、Token 调试、安全审计

### 2. 配色方案提取器（`color-palette-extractor`）
- 上传图片自动提取 8 种主色（4-bit 颜色量化 + 频次排序）
- 基于 WCAG 2.1 计算对比度，逐对展示 "Aa 文本示例" 视觉效果
- 任意色卡可作为基准色，实时生成所有颜色对的 AAA/AA 评级
- 多格式代码导出：CSS Variables、SCSS、JSON、Tailwind config
- 一键复制单个色号或整段代码
- 适用场景：UI 设计、品牌色提取、配色无障碍检查

### 3. 密码强度分析（`password-strength`）
- 字符集熵计算，识别小写/大写/数字/符号/汉字五种字符集
- 5 段可视化强度条 + 中文标签
- 估算离线破解时间（基于 10^10 guesses/sec）
- 检测重复模式（aaa）、连续序列（123、abc、qwe）
- 集成 **Have I Been Pwned** 公开泄露库查询，采用 k-anonymity 协议，仅发送 SHA-1 前 5 位
- 内置 16/24/32/64 位强密码生成器，使用 `crypto.getRandomValues`
- 适用场景：密码策略评估、用户教育、安全自检

## 代码质量改进

- 在 `WindowManager.tsx` 的 `componentMap` 中显式注册新应用，避免依赖动态 import 的回退逻辑，让打包器正确执行代码分割
- TypeScript 严格模式下零错误通过（`npm run typecheck`）
- ESLint 零错误（`npm run lint`）—— 仅与现有代码库一致的纯函数式渲染告警
- 生产构建成功，新增 chunk 大小：JWT 8.6 KB / 配色 9.6 KB / 密码 9.9 KB（gzip 前）

## 文档与部署

- README 新增 3 个应用的介绍条目，归类到「开发工具」段落
- 在线服务集成段落补充 HIBP API 说明
- 致谢段落补充 Pyodide、marked、Lucide Icons 等依赖来源
- GitHub Pages 工作流无需调整：base 路径 `/WebLinuxOS/`、`.nojekyll` 已就位
- 工作流增加 `cp ./index.html ./404.html` 兜底，刷新子路径不会 404

## 兼容性

- 新应用仅使用标准 Web API（`crypto.subtle.digest`、`canvas.getContext('2d')`、`fetch`、`Intl.RelativeTimeFormat`），无新增 npm 依赖
- 兼容 Chrome 100+ / Firefox 100+ / Safari 15+ / Edge 100+
- 离线场景下 HIBP 查询会降级为错误提示，其余功能完全本地可用
