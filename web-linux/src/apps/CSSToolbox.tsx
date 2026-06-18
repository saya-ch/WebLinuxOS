import { useState, useMemo, useCallback } from 'react'
import { useStore } from '../store'

interface ColorStop {
  id: string
  color: string
  position: number
}

interface ShadowLayer {
  id: string
  inset: boolean
  offsetX: number
  offsetY: number
  blur: number
  spread: number
  color: string
}

interface TextShadowLayer {
  id: string
  offsetX: number
  offsetY: number
  blur: number
  color: string
}

const uid = () => Math.random().toString(36).slice(2, 9)

const tabs = [
  { key: 'gradient', label: '渐变', icon: '🎨' },
  { key: 'shadow', label: '阴影', icon: '💫' },
  { key: 'radius', label: '圆角', icon: '⭕' },
  { key: 'flex', label: 'Flex', icon: '📐' },
  { key: 'grid', label: 'Grid', icon: '🟦' },
  { key: 'textshadow', label: '文字阴影', icon: '✍️' },
]

const SectionHeader = ({
  children,
  dark,
}: {
  children: React.ReactNode
  dark: boolean
}) => (
  <h3
    className="text-sm font-semibold mb-2"
    style={{ color: dark ? '#e5e5e5' : '#333' }}
  >
    {children}
  </h3>
)

const ControlRow = ({
  label,
  children,
  dark,
}: {
  label: string
  children: React.ReactNode
  dark: boolean
}) => (
  <div className="flex items-center justify-between mb-2 gap-2">
    <span
      className="text-xs whitespace-nowrap"
      style={{ color: dark ? '#bbb' : '#555' }}
    >
      {label}
    </span>
    <div className="flex items-center gap-2 flex-1">{children}</div>
  </div>
)

const RangeNumber = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  unit = '',
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  unit?: string
}) => (
  <>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="flex-1 h-1 rounded appearance-none cursor-pointer accent-indigo-500"
    />
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-16 px-1 py-1 text-xs rounded border"
      style={{
        borderColor: '#ccc',
        background: 'transparent',
        color: 'inherit',
      }}
    />
    {unit && (
      <span className="text-xs opacity-60 w-6 text-left">{unit}</span>
    )}
  </>
)

const CopyButton = ({
  text,
  dark,
}: {
  text: string
  dark: boolean
}) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
      })
      .catch(() => {})
  }
  return (
    <button
      onClick={handleCopy}
      className="text-xs px-2 py-1 rounded transition-colors"
      style={{
        background: dark ? '#3a3a3a' : '#eee',
        color: dark ? '#e5e5e5' : '#333',
      }}
    >
      {copied ? '✓ 已复制' : '复制'}
    </button>
  )
}

const CodeBlock = ({
  code,
  dark,
}: {
  code: string
  dark: boolean
}) => (
  <div
    className="relative rounded p-3"
    style={{
      background: dark ? '#1a1a1a' : '#f5f5f5',
      border: `1px solid ${dark ? '#333' : '#ddd'}`,
    }}
  >
    <div className="flex justify-end mb-1">
      <CopyButton text={code} dark={dark} />
    </div>
    <pre
      className="text-xs overflow-auto whitespace-pre-wrap"
      style={{
        fontFamily:
          'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        color: dark ? '#d4d4d4' : '#333',
        maxHeight: '180px',
      }}
    >
      <code>{code}</code>
    </pre>
  </div>
)

const PresetButton = ({
  label,
  onClick,
  dark,
}: {
  label: string
  onClick: () => void
  dark: boolean
}) => (
  <button
    onClick={onClick}
    className="px-2 py-1 text-xs rounded transition-colors"
    style={{
      background: dark ? '#3a3a3a' : '#f0f0f0',
      color: dark ? '#e5e5e5' : '#333',
      border: `1px solid ${dark ? '#444' : '#ddd'}`,
    }}
  >
    {label}
  </button>
)

function GradientTool({ dark }: { dark: boolean }) {
  const [type, setType] = useState<'linear' | 'radial'>('linear')
  const [angle, setAngle] = useState(90)
  const [radialShape, setRadialShape] = useState<'circle' | 'ellipse'>('circle')
  const [stops, setStops] = useState<ColorStop[]>([
    { id: uid(), color: '#667eea', position: 0 },
    { id: uid(), color: '#764ba2', position: 100 },
  ])

  const addStop = () => {
    const pos =
      stops.length > 0
        ? stops[Math.floor(stops.length / 2)].position
        : 50
    setStops([
      ...stops,
      { id: uid(), color: '#ffffff', position: pos },
    ])
  }

  const removeStop = (id: string) => {
    if (stops.length <= 2) return
    setStops(stops.filter((s) => s.id !== id))
  }

  const updateStop = (
    id: string,
    patch: Partial<ColorStop>
  ) => {
    setStops(
      stops.map((s) => (s.id === id ? { ...s, ...patch } : s))
    )
  }

  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => a.position - b.position),
    [stops]
  )

  const gradientValue = useMemo(() => {
    const stopStr = sortedStops
      .map((s) => `${s.color} ${s.position}%`)
      .join(', ')
    if (type === 'linear') {
      return `linear-gradient(${angle}deg, ${stopStr})`
    }
    return `radial-gradient(${radialShape}, ${stopStr})`
  }, [type, angle, radialShape, sortedStops])

  const cssCode = `.my-element {
  background: ${gradientValue};
}`

  const applyPreset = (
    preset: ColorStop[]
  ) => {
    setStops(
      preset.map((p) => ({ ...p, id: uid() }))
    )
  }

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
      <div
        className="rounded-lg p-4 flex items-center justify-center"
        style={{
          background: gradientValue,
          minHeight: '220px',
          border: `1px solid ${dark ? '#333' : '#ddd'}`,
        }}
      >
        <span
          className="text-2xl font-bold select-none"
          style={{
            color: 'white',
            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          实时预览
        </span>
      </div>

      <div>
        <SectionHeader dark={dark}>类型</SectionHeader>
        <ControlRow dark={dark} label="类型">
          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value as 'linear' | 'radial')
            }
            className="flex-1 px-2 py-1 text-xs rounded border"
            style={{
              background: dark ? '#2a2a2a' : '#fff',
              borderColor: dark ? '#444' : '#ddd',
              color: 'inherit',
            }}
          >
            <option value="linear">线性渐变</option>
            <option value="radial">径向渐变</option>
          </select>
        </ControlRow>

        {type === 'linear' ? (
          <ControlRow dark={dark} label="角度">
            <RangeNumber
              value={angle}
              min={0}
              max={360}
              onChange={setAngle}
              unit="°"
            />
          </ControlRow>
        ) : (
          <ControlRow dark={dark} label="形状">
            <select
              value={radialShape}
              onChange={(e) =>
                setRadialShape(
                  e.target.value as 'circle' | 'ellipse'
                )
              }
              className="flex-1 px-2 py-1 text-xs rounded border"
              style={{
                background: dark ? '#2a2a2a' : '#fff',
                borderColor: dark ? '#444' : '#ddd',
                color: 'inherit',
              }}
            >
              <option value="circle">圆形</option>
              <option value="ellipse">椭圆</option>
            </select>
          </ControlRow>
        )}

        <SectionHeader dark={dark}>预设</SectionHeader>
        <div className="flex flex-wrap gap-2 mb-3">
          <PresetButton
            label="现代渐变"
            dark={dark}
            onClick={() =>
              applyPreset([
                { id: '', color: '#667eea', position: 0 },
                { id: '', color: '#764ba2', position: 100 },
              ])
            }
          />
          <PresetButton
            label="日落"
            dark={dark}
            onClick={() =>
              applyPreset([
                { id: '', color: '#ff9a9e', position: 0 },
                { id: '', color: '#fad0c4', position: 50 },
                { id: '', color: '#fad0c4', position: 100 },
              ])
            }
          />
          <PresetButton
            label="海洋"
            dark={dark}
            onClick={() =>
              applyPreset([
                { id: '', color: '#2193b0', position: 0 },
                { id: '', color: '#6dd5ed', position: 100 },
              ])
            }
          />
          <PresetButton
            label="霓虹"
            dark={dark}
            onClick={() =>
              applyPreset([
                { id: '', color: '#ff0080', position: 0 },
                { id: '', color: '#ff8c00', position: 50 },
                { id: '', color: '#40e0d0', position: 100 },
              ])
            }
          />
          <PresetButton
            label="深空"
            dark={dark}
            onClick={() =>
              applyPreset([
                { id: '', color: '#0f2027', position: 0 },
                { id: '', color: '#203a43', position: 50 },
                { id: '', color: '#2c5364', position: 100 },
              ])
            }
          />
        </div>

        <div className="flex justify-between items-center mb-2">
          <SectionHeader dark={dark}>颜色节点</SectionHeader>
          <button
            onClick={addStop}
            className="text-xs px-2 py-1 rounded"
            style={{
              background: dark ? '#3a3a3a' : '#eee',
              color: dark ? '#e5e5e5' : '#333',
            }}
          >
            + 添加
          </button>
        </div>

        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {sortedStops.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-2 p-2 rounded"
              style={{
                background: dark ? '#2a2a2a' : '#f8f8f8',
              }}
            >
              <input
                type="color"
                value={s.color}
                onChange={(e) =>
                  updateStop(s.id, { color: e.target.value })
                }
                className="w-8 h-8 rounded border-0 cursor-pointer"
              />
              <RangeNumber
                value={s.position}
                min={0}
                max={100}
                onChange={(v) => updateStop(s.id, { position: v })}
                unit="%"
              />
              <button
                onClick={() => removeStop(s.id)}
                disabled={stops.length <= 2}
                className="text-xs px-2 py-1 rounded"
                style={{
                  opacity: stops.length <= 2 ? 0.3 : 1,
                  background: dark ? '#3a3a3a' : '#eee',
                  color: dark ? '#e5e5e5' : '#333',
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <SectionHeader dark={dark}>CSS 代码</SectionHeader>
        <CodeBlock code={cssCode} dark={dark} />
      </div>
    </div>
  )
}

function ShadowTool({ dark }: { dark: boolean }) {
  const [layers, setLayers] = useState<ShadowLayer[]>([
    {
      id: uid(),
      inset: false,
      offsetX: 0,
      offsetY: 10,
      blur: 30,
      spread: 0,
      color: 'rgba(0, 0, 0, 0.2)',
    },
  ])

  const updateLayer = (
    id: string,
    patch: Partial<ShadowLayer>
  ) => {
    setLayers(
      layers.map((l) => (l.id === id ? { ...l, ...patch } : l))
    )
  }

  const addLayer = () => {
    setLayers([
      ...layers,
      {
        id: uid(),
        inset: false,
        offsetX: 0,
        offsetY: 5,
        blur: 15,
        spread: 0,
        color: 'rgba(0, 0, 0, 0.15)',
      },
    ])
  }

  const removeLayer = (id: string) => {
    if (layers.length <= 1) return
    setLayers(layers.filter((l) => l.id !== id))
  }

  const shadowValue = useMemo(
    () =>
      layers
        .map(
          (l) =>
            `${l.inset ? 'inset ' : ''}${l.offsetX}px ${l.offsetY}px ${l.blur}px ${l.spread}px ${l.color}`
        )
        .join(',\n          '),
    [layers]
  )

  const cssCode = `.my-element {
  box-shadow: ${layers
    .map(
      (l) =>
        `${l.inset ? 'inset ' : ''}${l.offsetX}px ${l.offsetY}px ${l.blur}px ${l.spread}px ${l.color}`
    )
    .join(', ')};
}`

  const applyPreset = (preset: ShadowLayer[]) => {
    setLayers(preset.map((p) => ({ ...p, id: uid() })))
  }

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
      <div
        className="rounded-lg p-4 flex items-center justify-center"
        style={{
          minHeight: '220px',
          background: dark ? '#2a2a2a' : '#fff',
        }}
      >
        <div
          className="rounded"
          style={{
            width: '160px',
            height: '160px',
            background: dark ? '#3a3a3a' : '#fafafa',
            border: `1px solid ${dark ? '#444' : '#eee'}`,
            boxShadow: shadowValue,
          }}
        />
      </div>

      <div>
        <SectionHeader dark={dark}>预设</SectionHeader>
        <div className="flex flex-wrap gap-2 mb-3">
          <PresetButton
            label="经典阴影"
            dark={dark}
            onClick={() =>
              applyPreset([
                {
                  id: '',
                  inset: false,
                  offsetX: 0,
                  offsetY: 10,
                  blur: 30,
                  spread: -5,
                  color: 'rgba(0, 0, 0, 0.3)',
                },
              ])
            }
          />
          <PresetButton
            label="柔和阴影"
            dark={dark}
            onClick={() =>
              applyPreset([
                {
                  id: '',
                  inset: false,
                  offsetX: 0,
                  offsetY: 2,
                  blur: 8,
                  spread: 0,
                  color: 'rgba(0, 0, 0, 0.1)',
                },
              ])
            }
          />
          <PresetButton
            label="投影"
            dark={dark}
            onClick={() =>
              applyPreset([
                {
                  id: '',
                  inset: false,
                  offsetX: 0,
                  offsetY: 20,
                  blur: 40,
                  spread: -10,
                  color: 'rgba(0, 0, 0, 0.5)',
                },
              ])
            }
          />
          <PresetButton
            label="多层阴影"
            dark={dark}
            onClick={() =>
              applyPreset([
                {
                  id: '',
                  inset: false,
                  offsetX: 0,
                  offsetY: 1,
                  blur: 1,
                  spread: 0,
                  color: 'rgba(0, 0, 0, 0.12)',
                },
                {
                  id: '',
                  inset: false,
                  offsetX: 0,
                  offsetY: 10,
                  blur: 20,
                  spread: -5,
                  color: 'rgba(0, 0, 0, 0.3)',
                },
              ])
            }
          />
          <PresetButton
            label="内阴影"
            dark={dark}
            onClick={() =>
              applyPreset([
                {
                  id: '',
                  inset: true,
                  offsetX: 3,
                  offsetY: 3,
                  blur: 6,
                  spread: 0,
                  color: 'rgba(0, 0, 0, 0.2)',
                },
              ])
            }
          />
        </div>

        <div className="flex justify-between items-center mb-2">
          <SectionHeader dark={dark}>阴影层 ({layers.length})</SectionHeader>
          <button
            onClick={addLayer}
            className="text-xs px-2 py-1 rounded"
            style={{
              background: dark ? '#3a3a3a' : '#eee',
              color: dark ? '#e5e5e5' : '#333',
            }}
          >
            + 添加
          </button>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {layers.map((l, i) => (
            <div
              key={l.id}
              className="p-2 rounded"
              style={{
                background: dark ? '#2a2a2a' : '#f8f8f8',
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <span
                  className="text-xs font-semibold"
                  style={{ color: dark ? '#bbb' : '#555' }}
                >
                  层 #{i + 1}
                </span>
                <div className="flex items-center gap-2">
                  <label
                    className="text-xs flex items-center gap-1"
                    style={{ color: dark ? '#bbb' : '#555' }}
                  >
                    <input
                      type="checkbox"
                      checked={l.inset}
                      onChange={(e) =>
                        updateLayer(l.id, {
                          inset: e.target.checked,
                        })
                      }
                    />
                    内阴影
                  </label>
                  <button
                    onClick={() => removeLayer(l.id)}
                    disabled={layers.length <= 1}
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      opacity: layers.length <= 1 ? 0.3 : 1,
                      background: dark ? '#3a3a3a' : '#eee',
                      color: dark ? '#e5e5e5' : '#333',
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
              <ControlRow dark={dark} label="X 偏移">
                <RangeNumber
                  value={l.offsetX}
                  min={-100}
                  max={100}
                  onChange={(v) =>
                    updateLayer(l.id, { offsetX: v })
                  }
                  unit="px"
                />
              </ControlRow>
              <ControlRow dark={dark} label="Y 偏移">
                <RangeNumber
                  value={l.offsetY}
                  min={-100}
                  max={100}
                  onChange={(v) =>
                    updateLayer(l.id, { offsetY: v })
                  }
                  unit="px"
                />
              </ControlRow>
              <ControlRow dark={dark} label="模糊">
                <RangeNumber
                  value={l.blur}
                  min={0}
                  max={200}
                  onChange={(v) =>
                    updateLayer(l.id, { blur: v })
                  }
                  unit="px"
                />
              </ControlRow>
              <ControlRow dark={dark} label="扩展">
                <RangeNumber
                  value={l.spread}
                  min={-50}
                  max={100}
                  onChange={(v) =>
                    updateLayer(l.id, { spread: v })
                  }
                  unit="px"
                />
              </ControlRow>
              <ControlRow dark={dark} label="颜色">
                <input
                  type="color"
                  value={l.color.startsWith('rgba')
                    ? '#000000'
                    : l.color}
                  onChange={(e) =>
                    updateLayer(l.id, { color: e.target.value })
                  }
                  className="w-8 h-6 rounded cursor-pointer"
                />
              </ControlRow>
            </div>
          ))}
        </div>
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <SectionHeader dark={dark}>CSS 代码</SectionHeader>
        <CodeBlock code={cssCode} dark={dark} />
      </div>
    </div>
  )
}

function RadiusTool({ dark }: { dark: boolean }) {
  const [tlx, setTlx] = useState(20)
  const [tly, setTly] = useState(20)
  const [trx, setTrx] = useState(20)
  const [try_, setTry] = useState(20)
  const [brx, setBrx] = useState(20)
  const [bry, setBry] = useState(20)
  const [blx, setBlx] = useState(20)
  const [bly, setBly] = useState(20)
  const [uniform, setUniform] = useState(true)
  const [uniformVal, setUniformVal] = useState(20)

  const handleUniform = (v: number) => {
    setUniformVal(v)
    if (uniform) {
      setTlx(v)
      setTly(v)
      setTrx(v)
      setTry(v)
      setBrx(v)
      setBry(v)
      setBlx(v)
      setBly(v)
    }
  }

  const radiusStr = useMemo(() => {
    if (
      tlx === tly &&
      trx === try_ &&
      brx === bry &&
      blx === bly &&
      tlx === trx &&
      trx === brx &&
      brx === blx
    ) {
      return `${tlx}px`
    }
    return `${tlx}px ${trx}px ${brx}px ${blx}px / ${tly}px ${try_}px ${bry}px ${bly}px`
  }, [tlx, tly, trx, try_, brx, bry, blx, bly])

  const cssCode = `.my-element {
  border-radius: ${radiusStr};
}`

  const applyPreset = (v: number) => {
    setUniform(true)
    handleUniform(v)
  }

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
      <div
        className="rounded-lg p-4 flex items-center justify-center"
        style={{
          minHeight: '220px',
          background: dark ? '#2a2a2a' : '#f0f0f0',
        }}
      >
        <div
          className="flex items-center justify-center"
          style={{
            width: '180px',
            height: '180px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: radiusStr,
          }}
        >
          <span className="text-white text-lg font-bold">预览</span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            className="text-xs flex items-center gap-2"
            style={{ color: dark ? '#bbb' : '#555' }}
          >
            <input
              type="checkbox"
              checked={uniform}
              onChange={(e) => setUniform(e.target.checked)}
            />
            统一半径
          </label>
        </div>

        {uniform ? (
          <ControlRow dark={dark} label="圆角">
            <RangeNumber
              value={uniformVal}
              min={0}
              max={200}
              onChange={handleUniform}
              unit="px"
            />
          </ControlRow>
        ) : (
          <>
            <SectionHeader dark={dark}>水平半径</SectionHeader>
            <ControlRow dark={dark} label="左上 X">
              <RangeNumber
                value={tlx}
                min={0}
                max={200}
                onChange={setTlx}
                unit="px"
              />
            </ControlRow>
            <ControlRow dark={dark} label="右上 X">
              <RangeNumber
                value={trx}
                min={0}
                max={200}
                onChange={setTrx}
                unit="px"
              />
            </ControlRow>
            <ControlRow dark={dark} label="右下 X">
              <RangeNumber
                value={brx}
                min={0}
                max={200}
                onChange={setBrx}
                unit="px"
              />
            </ControlRow>
            <ControlRow dark={dark} label="左下 X">
              <RangeNumber
                value={blx}
                min={0}
                max={200}
                onChange={setBlx}
                unit="px"
              />
            </ControlRow>
            <SectionHeader dark={dark}>垂直半径</SectionHeader>
            <ControlRow dark={dark} label="左上 Y">
              <RangeNumber
                value={tly}
                min={0}
                max={200}
                onChange={setTly}
                unit="px"
              />
            </ControlRow>
            <ControlRow dark={dark} label="右上 Y">
              <RangeNumber
                value={try_}
                min={0}
                max={200}
                onChange={setTry}
                unit="px"
              />
            </ControlRow>
            <ControlRow dark={dark} label="右下 Y">
              <RangeNumber
                value={bry}
                min={0}
                max={200}
                onChange={setBry}
                unit="px"
              />
            </ControlRow>
            <ControlRow dark={dark} label="左下 Y">
              <RangeNumber
                value={bly}
                min={0}
                max={200}
                onChange={setBly}
                unit="px"
              />
            </ControlRow>
          </>
        )}

        <SectionHeader dark={dark}>预设</SectionHeader>
        <div className="flex flex-wrap gap-2 mb-3">
          <PresetButton label="方形" dark={dark} onClick={() => applyPreset(0)} />
          <PresetButton label="小圆角" dark={dark} onClick={() => applyPreset(4)} />
          <PresetButton label="中等圆角" dark={dark} onClick={() => applyPreset(12)} />
          <PresetButton label="大圆角" dark={dark} onClick={() => applyPreset(24)} />
          <PresetButton label="药丸形" dark={dark} onClick={() => applyPreset(999)} />
          <PresetButton
            label="胶囊"
            dark={dark}
            onClick={() => {
              setUniform(false)
              setTlx(100)
              setTly(100)
              setTrx(0)
              setTry(0)
              setBrx(100)
              setBry(100)
              setBlx(0)
              setBly(0)
            }}
          />
        </div>
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <SectionHeader dark={dark}>CSS 代码</SectionHeader>
        <CodeBlock code={cssCode} dark={dark} />
      </div>
    </div>
  )
}

function FlexTool({ dark }: { dark: boolean }) {
  const [direction, setDirection] = useState('row')
  const [justify, setJustify] = useState('flex-start')
  const [align, setAlign] = useState('center')
  const [wrap, setWrap] = useState('nowrap')
  const [gap, setGap] = useState(10)
  const [itemCount, setItemCount] = useState(4)
  const [itemSize, setItemSize] = useState(60)

  const cssCode = `.flex-container {
  display: flex;
  flex-direction: ${direction};
  justify-content: ${justify};
  align-items: ${align};
  flex-wrap: ${wrap};
  gap: ${gap}px;
}`

  const selectStyle: React.CSSProperties = {
    background: dark ? '#2a2a2a' : '#fff',
    borderColor: dark ? '#444' : '#ddd',
    color: 'inherit',
  }

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
      <div
        className="rounded-lg p-4"
        style={{
          minHeight: '220px',
          background: dark ? '#2a2a2a' : '#f0f0f0',
        }}
      >
        <div
          className="h-full w-full"
          style={{
            display: 'flex',
            flexDirection: direction as any,
            justifyContent: justify as any,
            alignItems: align as any,
            flexWrap: wrap as any,
            gap: `${gap}px`,
            minHeight: '180px',
            border: `2px dashed ${dark ? '#555' : '#bbb'}`,
            borderRadius: '8px',
            padding: '10px',
          }}
        >
          {Array.from({ length: itemCount }).map((_, i) => (
            <div
              key={i}
              className="rounded flex items-center justify-center"
              style={{
                width: direction === 'column' ? '100%' : `${itemSize}px`,
                height:
                  direction === 'column'
                    ? `${itemSize}px`
                    : 'auto',
                minHeight:
                  direction === 'column' ? 'auto' : `${itemSize}px`,
                background: `hsl(${210 + i * 30}, 60%, ${dark ? 55 : 60}%)`,
                color: 'white',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      <div>
        <ControlRow dark={dark} label="方向">
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            className="flex-1 px-2 py-1 text-xs rounded border"
            style={selectStyle}
          >
            <option value="row">row（水平）</option>
            <option value="row-reverse">row-reverse</option>
            <option value="column">column（垂直）</option>
            <option value="column-reverse">column-reverse</option>
          </select>
        </ControlRow>
        <ControlRow dark={dark} label="主轴对齐">
          <select
            value={justify}
            onChange={(e) => setJustify(e.target.value)}
            className="flex-1 px-2 py-1 text-xs rounded border"
            style={selectStyle}
          >
            <option value="flex-start">flex-start</option>
            <option value="flex-end">flex-end</option>
            <option value="center">center</option>
            <option value="space-between">space-between</option>
            <option value="space-around">space-around</option>
            <option value="space-evenly">space-evenly</option>
          </select>
        </ControlRow>
        <ControlRow dark={dark} label="交叉轴对齐">
          <select
            value={align}
            onChange={(e) => setAlign(e.target.value)}
            className="flex-1 px-2 py-1 text-xs rounded border"
            style={selectStyle}
          >
            <option value="flex-start">flex-start</option>
            <option value="flex-end">flex-end</option>
            <option value="center">center</option>
            <option value="stretch">stretch</option>
            <option value="baseline">baseline</option>
          </select>
        </ControlRow>
        <ControlRow dark={dark} label="换行">
          <select
            value={wrap}
            onChange={(e) => setWrap(e.target.value)}
            className="flex-1 px-2 py-1 text-xs rounded border"
            style={selectStyle}
          >
            <option value="nowrap">nowrap</option>
            <option value="wrap">wrap</option>
            <option value="wrap-reverse">wrap-reverse</option>
          </select>
        </ControlRow>
        <ControlRow dark={dark} label="间距">
          <RangeNumber value={gap} min={0} max={80} onChange={setGap} unit="px" />
        </ControlRow>
        <ControlRow dark={dark} label="子元素数量">
          <RangeNumber
            value={itemCount}
            min={1}
            max={10}
            onChange={setItemCount}
          />
        </ControlRow>
        <ControlRow dark={dark} label="子元素大小">
          <RangeNumber
            value={itemSize}
            min={30}
            max={150}
            onChange={setItemSize}
            unit="px"
          />
        </ControlRow>
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <SectionHeader dark={dark}>CSS 代码</SectionHeader>
        <CodeBlock code={cssCode} dark={dark} />
      </div>
    </div>
  )
}

function GridTool({ dark }: { dark: boolean }) {
  const [cols, setCols] = useState(3)
  const [rows, setRows] = useState(2)
  const [colGap, setColGap] = useState(10)
  const [rowGap, setRowGap] = useState(10)
  const [colTemplate, setColTemplate] = useState('1fr')
  const [rowTemplate, setRowTemplate] = useState('1fr')

  const colStr = `${colTemplate} `.repeat(cols).trim()
  const rowStr = `${rowTemplate} `.repeat(rows).trim()

  const cssCode = `.grid-container {
  display: grid;
  grid-template-columns: ${colStr};
  grid-template-rows: ${rowStr};
  grid-column-gap: ${colGap}px;
  grid-row-gap: ${rowGap}px;
}`

  const selectStyle: React.CSSProperties = {
    background: dark ? '#2a2a2a' : '#fff',
    borderColor: dark ? '#444' : '#ddd',
    color: 'inherit',
  }

  const totalItems = cols * rows

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
      <div
        className="rounded-lg p-4"
        style={{
          minHeight: '220px',
          background: dark ? '#2a2a2a' : '#f0f0f0',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: colStr,
            gridTemplateRows: rowStr,
            gap: `${rowGap}px ${colGap}px`,
            minHeight: '180px',
            border: `2px dashed ${dark ? '#555' : '#bbb'}`,
            borderRadius: '8px',
            padding: '10px',
          }}
        >
          {Array.from({ length: totalItems }).map((_, i) => (
            <div
              key={i}
              className="rounded flex items-center justify-center"
              style={{
                minHeight: '40px',
                background: `hsl(${200 + i * 20}, 60%, ${dark ? 55 : 60}%)`,
                color: 'white',
                fontWeight: 600,
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      <div>
        <ControlRow dark={dark} label="列数">
          <RangeNumber value={cols} min={1} max={10} onChange={setCols} />
        </ControlRow>
        <ControlRow dark={dark} label="行数">
          <RangeNumber value={rows} min={1} max={10} onChange={setRows} />
        </ControlRow>
        <ControlRow dark={dark} label="列间距">
          <RangeNumber
            value={colGap}
            min={0}
            max={80}
            onChange={setColGap}
            unit="px"
          />
        </ControlRow>
        <ControlRow dark={dark} label="行间距">
          <RangeNumber
            value={rowGap}
            min={0}
            max={80}
            onChange={setRowGap}
            unit="px"
          />
        </ControlRow>
        <ControlRow dark={dark} label="列模板">
          <select
            value={colTemplate}
            onChange={(e) => setColTemplate(e.target.value)}
            className="flex-1 px-2 py-1 text-xs rounded border"
            style={selectStyle}
          >
            <option value="1fr">1fr</option>
            <option value="2fr">2fr</option>
            <option value="100px">100px</option>
            <option value="200px">200px</option>
            <option value="minmax(100px, 1fr)">minmax(100px, 1fr)</option>
            <option value="auto">auto</option>
          </select>
        </ControlRow>
        <ControlRow dark={dark} label="行模板">
          <select
            value={rowTemplate}
            onChange={(e) => setRowTemplate(e.target.value)}
            className="flex-1 px-2 py-1 text-xs rounded border"
            style={selectStyle}
          >
            <option value="1fr">1fr</option>
            <option value="2fr">2fr</option>
            <option value="100px">100px</option>
            <option value="auto">auto</option>
          </select>
        </ControlRow>

        <SectionHeader dark={dark}>预设</SectionHeader>
        <div className="flex flex-wrap gap-2 mb-2">
          <PresetButton
            label="2x2"
            dark={dark}
            onClick={() => {
              setCols(2)
              setRows(2)
            }}
          />
          <PresetButton
            label="3x3"
            dark={dark}
            onClick={() => {
              setCols(3)
              setRows(3)
            }}
          />
          <PresetButton
            label="4列网格"
            dark={dark}
            onClick={() => {
              setCols(4)
              setRows(2)
            }}
          />
        </div>
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <SectionHeader dark={dark}>CSS 代码</SectionHeader>
        <CodeBlock code={cssCode} dark={dark} />
      </div>
    </div>
  )
}

function TextShadowTool({ dark }: { dark: boolean }) {
  const [layers, setLayers] = useState<TextShadowLayer[]>([
    { id: uid(), offsetX: 2, offsetY: 2, blur: 4, color: 'rgba(0, 0, 0, 0.5)' },
  ])
  const [textSize, setTextSize] = useState(48)
  const [textColor, setTextColor] = useState(dark ? '#ffffff' : '#333333')

  const updateLayer = (
    id: string,
    patch: Partial<TextShadowLayer>
  ) => {
    setLayers(
      layers.map((l) => (l.id === id ? { ...l, ...patch } : l))
    )
  }

  const addLayer = () => {
    setLayers([
      ...layers,
      {
        id: uid(),
        offsetX: 0,
        offsetY: 0,
        blur: 10,
        color: 'rgba(255, 255, 255, 0.5)',
      },
    ])
  }

  const removeLayer = (id: string) => {
    if (layers.length <= 1) return
    setLayers(layers.filter((l) => l.id !== id))
  }

  const shadowValue = layers
    .map((l) => `${l.offsetX}px ${l.offsetY}px ${l.blur}px ${l.color}`)
    .join(', ')

  const cssCode = `.my-text {
  font-size: ${textSize}px;
  color: ${textColor};
  text-shadow: ${shadowValue};
}`

  const applyPreset = (preset: TextShadowLayer[]) => {
    setLayers(preset.map((p) => ({ ...p, id: uid() })))
  }

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
      <div
        className="rounded-lg p-4 flex items-center justify-center"
        style={{
          minHeight: '220px',
          background: dark ? '#2a2a2a' : '#f0f0f0',
        }}
      >
        <span
          className="select-none font-bold"
          style={{
            fontSize: `${textSize}px`,
            color: textColor,
            textShadow: shadowValue,
          }}
        >
          文字阴影
        </span>
      </div>

      <div>
        <ControlRow dark={dark} label="字号">
          <RangeNumber
            value={textSize}
            min={12}
            max={120}
            onChange={setTextSize}
            unit="px"
          />
        </ControlRow>
        <ControlRow dark={dark} label="文字颜色">
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="w-10 h-8 rounded cursor-pointer"
          />
          <span className="text-xs opacity-60">{textColor}</span>
        </ControlRow>

        <SectionHeader dark={dark}>预设</SectionHeader>
        <div className="flex flex-wrap gap-2 mb-3">
          <PresetButton
            label="经典投影"
            dark={dark}
            onClick={() =>
              applyPreset([
                {
                  id: '',
                  offsetX: 2,
                  offsetY: 2,
                  blur: 2,
                  color: 'rgba(0, 0, 0, 0.5)',
                },
              ])
            }
          />
          <PresetButton
            label="长投影"
            dark={dark}
            onClick={() =>
              applyPreset([
                {
                  id: '',
                  offsetX: 6,
                  offsetY: 6,
                  blur: 2,
                  color: 'rgba(0, 0, 0, 0.4)',
                },
              ])
            }
          />
          <PresetButton
            label="发光效果"
            dark={dark}
            onClick={() =>
              applyPreset([
                {
                  id: '',
                  offsetX: 0,
                  offsetY: 0,
                  blur: 10,
                  color: 'rgba(102, 126, 234, 0.8)',
                },
                {
                  id: '',
                  offsetX: 0,
                  offsetY: 0,
                  blur: 20,
                  color: 'rgba(118, 75, 162, 0.6)',
                },
              ])
            }
          />
          <PresetButton
            label="霓虹文字"
            dark={dark}
            onClick={() =>
              applyPreset([
                { id: '', offsetX: 0, offsetY: 0, blur: 4, color: '#fff' },
                { id: '', offsetX: 0, offsetY: 0, blur: 8, color: '#ff00de' },
                {
                  id: '',
                  offsetX: 0,
                  offsetY: 0,
                  blur: 16,
                  color: '#ff00de',
                },
              ])
            }
          />
          <PresetButton
            label="浮雕"
            dark={dark}
            onClick={() =>
              applyPreset([
                { id: '', offsetX: 1, offsetY: 1, blur: 0, color: '#fff' },
                {
                  id: '',
                  offsetX: -1,
                  offsetY: -1,
                  blur: 0,
                  color: 'rgba(0, 0, 0, 0.3)',
                },
              ])
            }
          />
        </div>

        <div className="flex justify-between items-center mb-2">
          <SectionHeader dark={dark}>阴影层 ({layers.length})</SectionHeader>
          <button
            onClick={addLayer}
            className="text-xs px-2 py-1 rounded"
            style={{
              background: dark ? '#3a3a3a' : '#eee',
              color: dark ? '#e5e5e5' : '#333',
            }}
          >
            + 添加
          </button>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {layers.map((l, i) => (
            <div
              key={l.id}
              className="p-2 rounded"
              style={{
                background: dark ? '#2a2a2a' : '#f8f8f8',
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <span
                  className="text-xs font-semibold"
                  style={{ color: dark ? '#bbb' : '#555' }}
                >
                  层 #{i + 1}
                </span>
                <button
                  onClick={() => removeLayer(l.id)}
                  disabled={layers.length <= 1}
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    opacity: layers.length <= 1 ? 0.3 : 1,
                    background: dark ? '#3a3a3a' : '#eee',
                    color: dark ? '#e5e5e5' : '#333',
                  }}
                >
                  ×
                </button>
              </div>
              <ControlRow dark={dark} label="X 偏移">
                <RangeNumber
                  value={l.offsetX}
                  min={-50}
                  max={50}
                  onChange={(v) =>
                    updateLayer(l.id, { offsetX: v })
                  }
                  unit="px"
                />
              </ControlRow>
              <ControlRow dark={dark} label="Y 偏移">
                <RangeNumber
                  value={l.offsetY}
                  min={-50}
                  max={50}
                  onChange={(v) =>
                    updateLayer(l.id, { offsetY: v })
                  }
                  unit="px"
                />
              </ControlRow>
              <ControlRow dark={dark} label="模糊">
                <RangeNumber
                  value={l.blur}
                  min={0}
                  max={100}
                  onChange={(v) =>
                    updateLayer(l.id, { blur: v })
                  }
                  unit="px"
                />
              </ControlRow>
              <ControlRow dark={dark} label="颜色">
                <input
                  type="color"
                  value={l.color.startsWith('rgba') ? '#000000' : l.color}
                  onChange={(e) =>
                    updateLayer(l.id, { color: e.target.value })
                  }
                  className="w-8 h-6 rounded cursor-pointer"
                />
              </ControlRow>
            </div>
          ))}
        </div>
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <SectionHeader dark={dark}>CSS 代码</SectionHeader>
        <CodeBlock code={cssCode} dark={dark} />
      </div>
    </div>
  )
}

export default function CSSToolbox() {
  const theme = useStore((s) => s.theme)
  const dark = theme === 'dark'
  const [activeTab, setActiveTab] = useState('gradient')

  const bgColor = dark ? '#1a1a1a' : '#ffffff'
  const panelBg = dark ? '#242424' : '#fafafa'
  const textColor = dark ? '#e5e5e5' : '#333'
  const borderColor = dark ? '#333' : '#e0e0e0'
  const inactiveTabBg = dark ? '#2a2a2a' : '#f0f0f0'

  const renderPanel = useCallback(() => {
    switch (activeTab) {
      case 'gradient':
        return <GradientTool dark={dark} />
      case 'shadow':
        return <ShadowTool dark={dark} />
      case 'radius':
        return <RadiusTool dark={dark} />
      case 'flex':
        return <FlexTool dark={dark} />
      case 'grid':
        return <GridTool dark={dark} />
      case 'textshadow':
        return <TextShadowTool dark={dark} />
      default:
        return null
    }
  }, [activeTab, dark])

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: bgColor, color: textColor }}
    >
      <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">🎨</span>
          <div>
            <h1 className="text-lg font-bold">CSS 工具箱</h1>
            <p className="text-xs opacity-60">前端 CSS 样式生成器合集</p>
          </div>
        </div>
      </div>

      <div
        className="flex flex-wrap gap-2 p-3 border-b"
        style={{ borderColor, background: panelBg }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="px-3 py-2 rounded text-sm transition-all"
            style={{
              background:
                activeTab === t.key ? bgColor : inactiveTabBg,
              color: activeTab === t.key ? textColor : `${textColor}99`,
              border: `1px solid ${activeTab === t.key ? borderColor : 'transparent'}`,
              fontWeight: activeTab === t.key ? 600 : 400,
            }}
          >
            <span className="mr-1">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div
        className="flex-1 overflow-auto p-4"
        style={{ background: bgColor }}
      >
        {renderPanel()}
      </div>
    </div>
  )
}
