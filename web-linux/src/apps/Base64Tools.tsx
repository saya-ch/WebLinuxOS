import React, { useState } from 'react'
import { Copy, FileText, Image, CheckCircle2, Upload } from 'lucide-react'

const Base64Tools: React.FC = () => {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [copied, setCopied] = useState(false)
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')

  const encode = () => {
    try {
      const encoded = btoa(unescape(encodeURIComponent(inputText)))
      setOutputText(encoded)
    } catch (e) {
      setOutputText('编码错误')
    }
  }

  const decode = () => {
    try {
      const decoded = decodeURIComponent(escape(atob(inputText)))
      setOutputText(decoded)
    } catch (e) {
      setOutputText('解码错误: 无效的 Base64 字符串')
    }
  }

  const encodeFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setOutputText(result)
      setInputText(file.name)
    }
    reader.readAsDataURL(file)
  }

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(outputText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('复制失败:', e)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 text-blue-300">Base64 工具箱</h2>
        <p className="text-gray-400 text-sm">文本和文件的 Base64 编码/解码</p>
      </div>

      <div className="flex space-x-2 mb-4 border-b border-gray-700 pb-2">
        <button
          onClick={() => setMode('encode')}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
            mode === 'encode'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
          }`}
        >
          编码
        </button>
        <button
          onClick={() => setMode('decode')}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
            mode === 'decode'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
          }`}
        >
          解码
        </button>
      </div>

      <div className="space-y-4 flex-1">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <FileText className="inline w-4 h-4 mr-2" />
            {mode === 'encode' ? '输入文本' : '输入 Base64'}
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={mode === 'encode' ? '输入要编码的文本...' : '输入要解码的 Base64 字符串...'}
            className="w-full h-32 bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {mode === 'encode' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Upload className="inline w-4 h-4 mr-2" />
              或上传文件进行编码
            </label>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
              <input
                type="file"
                className="hidden"
                id="file-upload"
                onChange={(e) => e.target.files?.[0] && encodeFile(e.target.files[0])}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-gray-400 hover:text-blue-300"
              >
                点击或拖放文件到此处
              </label>
            </div>
          </div>
        )}

        <button
          onClick={mode === 'encode' ? encode : decode}
          disabled={!inputText.trim() && !outputText}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-blue-500/25"
        >
          {mode === 'encode' ? '编码为 Base64' : '解码 Base64'}
        </button>

        {outputText && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">
                <Image className="inline w-4 h-4 mr-2" />
                结果
              </label>
              <button
                onClick={copyOutput}
                className="flex items-center space-x-1 text-xs text-gray-400 hover:text-blue-300 transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span>已复制!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>复制</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 overflow-auto max-h-40">
              <pre className="text-sm text-gray-200 whitespace-pre-wrap break-all">{outputText}</pre>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 mb-2">使用说明</h3>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• 编码: 将文本转换为 Base64 字符串</li>
          <li>• 解码: 将 Base64 字符串转换为原始文本</li>
          <li>• 文件: 可上传任意文件获取其 Base64 编码</li>
        </ul>
      </div>
    </div>
  )
}

export default Base64Tools
