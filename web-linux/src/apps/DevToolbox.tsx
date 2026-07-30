/**
 * DevToolbox
 * --------------------------------------------------------------
 *  此文件作为 DevKit 应用的别名导出，保持向后兼容。
 *  历史上该应用 ID 为 'dev-toolbox'，现已统一为 'dev-kit'；
 *  早期注册到 registry 时使用 'dev-toolbox'，故保留此 re-export。
 *
 *  实际功能请参见 ./DevKit.tsx，包含 9 大类开发工具：
 *    JSON 格式化 · Base64 编解码 · URL 编解码 · 哈希生成
 *    UUID 生成 · 正则测试 · 颜色转换 · Markdown 预览 · 时间戳转换
 */
export { default } from './DevKit'
