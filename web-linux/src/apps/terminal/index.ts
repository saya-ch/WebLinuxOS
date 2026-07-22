// 终端命令注册入口
//
// 导入顺序很重要：registerCommand 默认会跳过重复注册（保留首次实现），
// 因此包含「权威实现」的模块必须在前，包含「扩展或重复实现」的模块在后。
// 如果某个命令确实需要在运行时被覆盖，请使用 registerCommand(name, def, { force: true, source: '...' })。

// 1. 核心命令框架（仅类型与注册器，不注册任何具体命令）
export * from './commands'

// 2. 权威实现：基础系统、文件、工具命令
import './fileCommands'        // 文件系统操作（ls/cd/cat/mkdir/rm/cp/mv/grep/find 等）
import './systemCommands'      // 系统命令（whoami/hostname/neofetch/version/about/uptime）
import './toolCommands'        // 工具命令（echo/base64/hash/uuid/calc/sort/uniq 等大量实用工具）

// 3. 权威实现：网络与创意命令（带本地回退数据，体验更佳）
import './networkCommands'     // 网络命令（ping/curl/ifconfig 等）
import './creativeCommands'    // 创意命令（nasa/wikipedia/github-trending - 含错误回退数据）

// 4. 独立功能模块：不与上述命令冲突
import './funCommands'
import './aiCommands'
import './advancedCommands'
import './storageCommands'

// 5. 扩展命令：历史记录、搜索、比较等实用功能
import './extendedCommands'

// 6. 增强API命令：集成公开API实现真实功能
import './enhancedApiCommands'

// 7. Pro命令集：更多实用工具和API集成
import './proCommands'

// 8. Power命令集：高级实用命令（gzip/gunzip/file/cut/paste/nl/expand/tr/split/timestamp/uuidv4/password-strength/regex-test/base64-url/cron-parse/url-info/converter/ascii-table/fortune/banner/cowsay/cowthink/dog/advice/flip/rps/matrix）
import './powerCommands'
