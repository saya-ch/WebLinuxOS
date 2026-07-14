/**
 * AI服务抽象层
 * 支持多个AI提供商的统一接口
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIProvider {
  name: string;
  isAvailable: boolean;
  chat(messages: AIMessage[]): Promise<AIResponse>;
  analyzeCode(code: string, language: string): Promise<AIResponse>;
  generateCode(prompt: string, language: string): Promise<AIResponse>;
  explainCode(code: string): Promise<AIResponse>;
}

/**
 * AI服务管理器
 * 统一管理多个AI提供商
 */
export class AIServiceManager {
  private providers: Map<string, AIProvider> = new Map();
  private defaultProvider: string = 'huggingface';

  /**
   * 注册AI提供商
   */
  registerProvider(provider: AIProvider): void {
    this.providers.set(provider.name, provider);
  }

  /**
   * 获取可用的提供商
   */
  getAvailableProviders(): AIProvider[] {
    return Array.from(this.providers.values()).filter(p => p.isAvailable);
  }

  /**
   * 发送聊天消息
   */
  async chat(messages: AIMessage[], provider?: string): Promise<AIResponse> {
    const p = this.providers.get(provider || this.defaultProvider);
    if (!p || !p.isAvailable) {
      return { success: false, error: 'Provider not available' };
    }
    return p.chat(messages);
  }

  /**
   * 分析代码
   */
  async analyzeCode(code: string, language: string, provider?: string): Promise<AIResponse> {
    const p = this.providers.get(provider || this.defaultProvider);
    if (!p || !p.isAvailable) {
      return { success: false, error: 'Provider not available' };
    }
    return p.analyzeCode(code, language);
  }

  /**
   * 生成代码
   */
  async generateCode(prompt: string, language: string, provider?: string): Promise<AIResponse> {
    const p = this.providers.get(provider || this.defaultProvider);
    if (!p || !p.isAvailable) {
      return { success: false, error: 'Provider not available' };
    }
    return p.generateCode(prompt, language);
  }

  /**
   * 解释代码
   */
  async explainCode(code: string, provider?: string): Promise<AIResponse> {
    const p = this.providers.get(provider || this.defaultProvider);
    if (!p || !p.isAvailable) {
      return { success: false, error: 'Provider not available' };
    }
    return p.explainCode(code);
  }
}

/**
 * 基于本地规则的基础AI提供者
 * 不依赖外部API，提供基础的代码分析功能
 */
export class LocalAIProvider implements AIProvider {
  name = 'local';
  isAvailable = true;

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    // 简单的本地响应逻辑
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'user') {
      const response = this.generateLocalResponse(lastMessage.content);
      return { success: true, content: response };
    }
    return { success: false, error: 'Invalid message format' };
  }

  async analyzeCode(code: string, language: string): Promise<AIResponse> {
    const analysis = this.performBasicAnalysis(code, language);
    return { success: true, content: analysis };
  }

  async generateCode(prompt: string, language: string): Promise<AIResponse> {
    // 提供基础的代码模板
    const template = this.getCodeTemplate(prompt, language);
    return { success: true, content: template };
  }

  async explainCode(code: string): Promise<AIResponse> {
    const explanation = this.generateBasicExplanation(code);
    return { success: true, content: explanation };
  }

  private generateLocalResponse(input: string): string {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
      return '你好！我是WebLinuxOS的AI助手。我可以帮助你分析代码、生成代码模板和解释代码。';
    }
    
    if (lowerInput.includes('help') || lowerInput.includes('帮助')) {
      return `我可以帮你：
1. 分析代码 - 输入"分析这段代码："+ 代码
2. 生成代码模板 - 输入"生成" + 语言 + "代码"
3. 解释代码 - 输入"解释" + 代码
4. 回答编程问题`;
    }

    return '我理解你的问题。作为WebLinuxOS的AI助手，我可以帮助分析代码、生成代码模板和解释代码逻辑。输入"帮助"查看我能做什么。';
  }

  private performBasicAnalysis(code: string, language: string): string {
    const lines = code.split('\n').length;
    const characters = code.length;
    const functions = (code.match(/function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(|=>\s*{/g) || []).length;
    const comments = (code.match(/\/\/.*|\/\*[\s\S]*?\*\/|#.*/g) || []).length;
    const complexity = this.estimateComplexity(code);

    return `📊 代码分析报告 (${language})

📝 基本信息:
- 行数: ${lines}
- 字符数: ${characters}
- 函数/方法数: ${functions}
- 注释数: ${comments}

📈 质量指标:
- 复杂度: ${complexity}
- 注释覆盖率: ${lines > 0 ? ((comments / lines) * 100).toFixed(1) : 0}%

💡 建议:
${this.generateSuggestions(code, language, { lines, functions, comments })}`;
  }

  private estimateComplexity(code: string): string {
    const loops = (code.match(/for\s*\(|while\s*\(|\.forEach\(|\.map\(|\.filter\(/g) || []).length;
    const conditions = (code.match(/if\s*\(|switch\s*\(|case\s+/g) || []).length;
    const nesting = this.getMaxNesting(code);

    const score = loops * 2 + conditions + nesting;
    
    if (score < 5) return '简单 (✓)';
    if (score < 15) return '中等 (⚠)';
    return '复杂 (⚠️)';
  }

  private getMaxNesting(code: string): number {
    let maxNesting = 0;
    let currentNesting = 0;
    
    for (const char of code) {
      if (char === '{') {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      } else if (char === '}') {
        currentNesting--;
      }
    }
    
    return maxNesting;
  }

  private generateSuggestions(code: string, _language: string, metrics: any): string {
    const suggestions: string[] = [];

    if (metrics.lines > 100) {
      suggestions.push('- 考虑将大文件拆分为更小的模块');
    }

    if (metrics.functions > 10) {
      suggestions.push('- 函数数量较多，可考虑按功能分组');
    }

    if (metrics.comments < metrics.lines * 0.1) {
      suggestions.push('- 添加更多注释以提高代码可读性');
    }

    if (!code.includes('try') && !code.includes('catch')) {
      suggestions.push('- 考虑添加错误处理逻辑');
    }

    if (suggestions.length === 0) {
      suggestions.push('- 代码结构良好，继续保持！');
    }

    return suggestions.join('\n');
  }

  private getCodeTemplate(prompt: string, language: string): string {
    const templates: Record<string, Record<string, string>> = {
      javascript: {
        function: `// 功能函数模板
function functionName(params) {
  // TODO: 实现功能
  const result = params;
  return result;
}

// 使用示例
// functionName(argument);`,
        class: `// 类模板
class ClassName {
  constructor(properties) {
    // 初始化属性
  }

  method() {
    // 方法实现
  }

  // Getter
  getProperty() {
    // return this.property;
  }

  // Setter
  setProperty(value) {
    // this.property = value;
  }
}`,
        async: `// 异步函数模板
async function asyncFunction(params) {
  try {
    const response = await fetchData(params);
    return response;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}`
      },
      python: {
        function: `# Python函数模板
def function_name(params):
    """
    函数说明
    
    Args:
        params: 参数说明
    
    Returns:
        返回值说明
    """
    # TODO: 实现功能
    result = params
    return result`,
        class: `# Python类模板
class ClassName:
    def __init__(self, properties):
        """初始化"""
        pass
    
    def method(self):
        """方法"""
        pass
    
    @property
    def property(self):
        """属性"""
        pass`
      },
      typescript: {
        interface: `// TypeScript接口模板
interface InterfaceName {
  property: string;
  method(): void;
}`,
        function: `// TypeScript函数模板
function functionName<T>(params: T): ReturnType {
  // TODO: 实现功能
  const result: ReturnType = params as ReturnType;
  return result;
}`
      }
    };

    const langTemplates = templates[language.toLowerCase()] || templates.javascript;
    
    // 根据prompt匹配最相关的模板
    for (const [key, template] of Object.entries(langTemplates)) {
      if (prompt.toLowerCase().includes(key)) {
        return template;
      }
    }

    // 默认返回基础函数模板
    return langTemplates.function || templates.javascript.function;
  }

  private generateBasicExplanation(code: string): string {
    const lines = code.split('\n');
    let explanation = '📚 代码解释:\n\n';

    // 基于代码结构的简单解释
    if (code.includes('function') || code.includes('=>')) {
      explanation += '✓ 这是一个函数定义\n';
    }

    if (code.includes('class')) {
      explanation += '✓ 这是一个类定义\n';
    }

    if (code.includes('import') || code.includes('require')) {
      explanation += '✓ 导入了外部模块\n';
    }

    if (code.includes('async') || code.includes('await')) {
      explanation += '✓ 使用了异步编程\n';
    }

    if (code.includes('try') && code.includes('catch')) {
      explanation += '✓ 包含错误处理逻辑\n';
    }

    if (code.includes('for') || code.includes('while') || code.includes('.forEach')) {
      explanation += '✓ 包含循环结构\n';
    }

    if (code.includes('if') || code.includes('switch')) {
      explanation += '✓ 包含条件判断\n';
    }

    explanation += `\n💡 代码共 ${lines.length} 行，包含 ${code.length} 个字符。`;

    return explanation;
  }
}

/**
 * API服务配置
 */
export const apiConfigs = {
  // 天气API - Open-Meteo (免费)
  weather: {
    baseUrl: 'https://api.open-meteo.com/v1',
    endpoints: {
      current: '/forecast',
      historical: '/forecast'
    }
  },

  // 新闻API - 可选配置
  news: {
    baseUrl: 'https://hacker-news.firebaseio.com/v0',
    endpoints: {
      topStories: '/topstories.json',
      item: '/item'
    }
  },

  // 翻译API - LibreTranslate (免费)
  translate: {
    baseUrl: 'https://api.argos-translate.com',
    endpoints: {
      translate: '/translate'
    }
  },

  // 货币API - CoinGecko (免费)
  crypto: {
    baseUrl: 'https://api.coingecko.com/api/v3',
    endpoints: {
      prices: '/simple/price',
      trending: '/search/trending'
    }
  },

  // 维基百科API
  wikipedia: {
    baseUrl: 'https://en.wikipedia.org/api/rest_v1',
    endpoints: {
      summary: '/page/summary',
      random: '/page/random/summary'
    }
  },

  // IP地址API
  ipapi: {
    baseUrl: 'https://ipapi.co/json'
  },

  // 引用API
  quotes: {
    baseUrl: 'https://api.quotable.io',
    endpoints: {
      random: '/random',
      quotes: '/quotes'
    }
  }
};

// 创建全局AI服务实例
export const aiService = new AIServiceManager();

// 注册本地AI提供者
aiService.registerProvider(new LocalAIProvider());