import { useState, memo } from 'react'
import { useStore } from '../store'

interface WorkflowStep {
  id: string
  type: 'trigger' | 'action' | 'condition' | 'delay'
  name: string
  config: Record<string, unknown>
}

interface Workflow {
  id: string
  name: string
  description: string
  steps: WorkflowStep[]
  enabled: boolean
  lastRun?: Date
  runCount: number
}

const TRIGGER_TYPES = [
  { id: 'manual', name: '手动触发', icon: '👆', description: '手动启动工作流' },
  { id: 'schedule', name: '定时执行', icon: '⏰', description: '按设定时间自动执行' },
  { id: 'event', name: '事件触发', icon: '⚡', description: '当特定事件发生时执行' },
]



const PRESET_WORKFLOWS: Workflow[] = [
  {
    id: 'daily-report',
    name: '每日数据报告',
    description: '每天定时汇总关键数据并发送报告',
    steps: [
      { id: '1', type: 'trigger', name: '定时触发', config: { time: '09:00', repeat: 'daily' } },
      { id: '2', type: 'action', name: '获取数据', config: { source: 'api', endpoint: '/api/stats' } },
      { id: '3', type: 'action', name: '生成报告', config: { format: 'markdown' } },
      { id: '4', type: 'action', name: '发送通知', config: { channel: 'system' } },
    ],
    enabled: true,
    runCount: 156,
  },
  {
    id: 'backup-task',
    name: '自动备份',
    description: '定期备份重要文件到安全位置',
    steps: [
      { id: '1', type: 'trigger', name: '定时触发', config: { time: '02:00', repeat: 'daily' } },
      { id: '2', type: 'action', name: '压缩文件', config: { target: '/documents' } },
      { id: '3', type: 'action', name: '上传备份', config: { destination: 'cloud' } },
      { id: '4', type: 'action', name: '发送通知', config: { channel: 'system', message: '备份完成' } },
    ],
    enabled: false,
    runCount: 89,
  },
  {
    id: 'api-monitor',
    name: 'API健康检查',
    description: '监控关键API端点的可用性',
    steps: [
      { id: '1', type: 'trigger', name: '定时触发', config: { interval: 5, unit: 'minutes' } },
      { id: '2', type: 'action', name: '检查API', config: { endpoints: ['/api/health', '/api/status'] } },
      { id: '3', type: 'condition', name: '故障判断', config: { checkResponse: true } },
      { id: '4', type: 'action', name: '告警通知', config: { channel: 'system', priority: 'high' } },
    ],
    enabled: true,
    runCount: 1247,
  },
]

export default memo(function WorkflowAutomation() {
  const addNotification = useStore((s) => s.addNotification)

  const [workflows, setWorkflows] = useState<Workflow[]>(PRESET_WORKFLOWS)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [showEditor, setShowEditor] = useState(false)

  const handleRunWorkflow = async (workflow: Workflow) => {
    setIsRunning(true)
    addNotification({
      title: '工作流执行中',
      message: `正在执行: ${workflow.name}`,
      type: 'info',
      duration: 2000,
    })

    // 模拟工作流执行
    await new Promise(resolve => setTimeout(resolve, 2000))

    setWorkflows(prev => prev.map(w =>
      w.id === workflow.id
        ? { ...w, lastRun: new Date(), runCount: w.runCount + 1 }
        : w
    ))

    setIsRunning(false)
    addNotification({
      title: '工作流完成',
      message: `${workflow.name} 执行成功`,
      type: 'success',
      duration: 3000,
    })
  }

  const handleToggleWorkflow = (workflowId: string) => {
    setWorkflows(prev => prev.map(w =>
      w.id === workflowId ? { ...w, enabled: !w.enabled } : w
    ))
  }

  const handleDeleteWorkflow = (workflowId: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== workflowId))
    if (selectedWorkflow?.id === workflowId) {
      setSelectedWorkflow(null)
    }
  }

  const formatLastRun = (date?: Date) => {
    if (!date) return '从未运行'
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diff < 60) return '刚刚'
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
    return date.toLocaleDateString('zh-CN')
  }

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--window-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
            工作流自动化
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
            自动化重复任务，提升工作效率
          </p>
        </div>
        <button
          onClick={() => setShowEditor(true)}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          + 新建工作流
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 左侧工作流列表 */}
        <div style={{
          width: 320,
          borderRight: '1px solid var(--window-border)',
          overflow: 'auto',
          padding: 12,
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            我的工作流 ({workflows.length})
          </div>

          {workflows.map(workflow => (
            <div
              key={workflow.id}
              onClick={() => setSelectedWorkflow(workflow)}
              style={{
                padding: 12,
                borderRadius: 8,
                border: selectedWorkflow?.id === workflow.id ? '1px solid var(--accent)' : '1px solid var(--window-border)',
                background: selectedWorkflow?.id === workflow.id ? 'var(--accent-bg)' : 'var(--window-bg)',
                cursor: 'pointer',
                marginBottom: 8,
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                  {workflow.name}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleWorkflow(workflow.id)
                  }}
                  style={{
                    padding: '2px 8px',
                    borderRadius: 10,
                    border: 'none',
                    background: workflow.enabled ? 'rgba(76,175,80,0.2)' : 'rgba(158,158,158,0.2)',
                    color: workflow.enabled ? '#4caf50' : '#9e9e9e',
                    cursor: 'pointer',
                    fontSize: 10,
                    fontWeight: 500,
                  }}
                >
                  {workflow.enabled ? '启用' : '禁用'}
                </button>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                {workflow.description}
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-secondary)' }}>
                <span>📊 {workflow.runCount}次执行</span>
                <span>⏱️ {formatLastRun(workflow.lastRun)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 右侧工作流详情 */}
        <div style={{ flex: 1, padding: 20, overflow: 'auto' }}>
          {selectedWorkflow ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {selectedWorkflow.name}
                  </h3>
                  <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>
                    {selectedWorkflow.description}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleRunWorkflow(selectedWorkflow)}
                    disabled={isRunning}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 6,
                      border: 'none',
                      background: isRunning ? 'var(--window-border)' : 'var(--accent)',
                      color: '#fff',
                      cursor: isRunning ? 'not-allowed' : 'pointer',
                      fontSize: 13,
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {isRunning ? '⚡ 执行中...' : '▶️ 立即执行'}
                  </button>
                  <button
                    onClick={() => handleDeleteWorkflow(selectedWorkflow.id)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 6,
                      border: '1px solid rgba(255,107,107,0.5)',
                      background: 'transparent',
                      color: '#ff6b6b',
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>

              {/* 统计信息 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                <div style={{ padding: 16, background: 'var(--window-bg)', border: '1px solid var(--window-border)', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--accent)' }}>{selectedWorkflow.runCount}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>总执行次数</div>
                </div>
                <div style={{ padding: 16, background: 'var(--window-bg)', border: '1px solid var(--window-border)', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)' }}>{selectedWorkflow.steps.length}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>工作流步骤</div>
                </div>
                <div style={{ padding: 16, background: 'var(--window-bg)', border: '1px solid var(--window-border)', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)' }}>{formatLastRun(selectedWorkflow.lastRun)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>上次执行</div>
                </div>
                <div style={{ padding: 16, background: 'var(--window-bg)', border: '1px solid var(--window-border)', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: selectedWorkflow.enabled ? '#4caf50' : '#9e9e9e' }}>
                    {selectedWorkflow.enabled ? '运行中' : '已停止'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>当前状态</div>
                </div>
              </div>

              {/* 工作流步骤可视化 */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  工作流步骤
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {selectedWorkflow.steps.map((step, index) => (
                    <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        padding: '10px 16px',
                        borderRadius: 8,
                        border: '1px solid var(--window-border)',
                        background: 'var(--window-bg)',
                        textAlign: 'center',
                        minWidth: 120,
                      }}>
                        <div style={{ fontSize: 18, marginBottom: 4 }}>
                          {step.type === 'trigger' ? '⚡' : step.type === 'action' ? '🎬' : step.type === 'condition' ? '🔍' : '⏳'}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{step.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {step.type === 'trigger' ? '触发器' : step.type === 'action' ? '动作' : step.type === 'condition' ? '条件' : '延时'}
                        </div>
                      </div>
                      {index < selectedWorkflow.steps.length - 1 && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: 16, padding: '0 4px' }}>→</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 步骤详情 */}
              <div>
                <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  步骤配置
                </h4>
                <div style={{ display: 'grid', gap: 12 }}>
                  {selectedWorkflow.steps.map((step, index) => (
                    <div
                      key={step.id}
                      style={{
                        padding: 16,
                        background: 'var(--window-bg)',
                        border: '1px solid var(--window-border)',
                        borderRadius: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: 'var(--accent-bg)',
                          color: 'var(--accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 600,
                        }}>
                          {index + 1}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{step.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                            {step.type === 'trigger' ? '触发器' : step.type === 'action' ? '动作' : step.type === 'condition' ? '条件' : '延时'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                        {Object.entries(step.config).map(([key, value]) => (
                          <div key={key} style={{ fontSize: 12 }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{key}: </span>
                            <span style={{ color: 'var(--text-primary)' }}>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>📋</div>
              <div style={{ fontSize: 16, marginBottom: 8 }}>选择一个工作流查看详情</div>
              <div style={{ fontSize: 12 }}>或点击"新建工作流"创建新的自动化任务</div>
            </div>
          )}
        </div>
      </div>

      {/* 创建/编辑工作流弹窗 */}
      {showEditor && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setShowEditor(false)}
        >
          <div
            style={{
              width: 600,
              maxHeight: '80vh',
              background: 'var(--window-bg)',
              border: '1px solid var(--window-border)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: 20, borderBottom: '1px solid var(--window-border)' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>创建新工作流</h3>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>工作流名称</label>
                <input
                  type="text"
                  placeholder="例如：每日数据同步"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--window-border)',
                    background: 'var(--window-bg)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                  }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>描述</label>
                <textarea
                  placeholder="描述这个工作流的作用..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--window-border)',
                    background: 'var(--window-bg)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    resize: 'vertical',
                  }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>触发类型</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {TRIGGER_TYPES.map(trigger => (
                    <div
                      key={trigger.id}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        border: '1px solid var(--window-border)',
                        background: 'var(--window-bg)',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{trigger.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{trigger.name}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button
                  onClick={() => setShowEditor(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 6,
                    border: '1px solid var(--window-border)',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    setShowEditor(false)
                    addNotification({
                      title: '工作流创建成功',
                      message: '新工作流已添加到列表中',
                      type: 'success',
                      duration: 3000,
                    })
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 6,
                    border: 'none',
                    background: 'var(--accent)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  创建工作流
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})
