import { useState } from 'react'
import { useStore } from '../store'

interface ContactData {
  id: string
  name: string
  phone: string
  email: string
  address: string
  group: string
  avatar: string
}

const presetContacts: ContactData[] = [
  { id: '1', name: '张三', phone: '138-0000-0001', email: 'zhangsan@example.com', address: '北京市朝阳区建国路88号', group: '同事', avatar: '👨' },
  { id: '2', name: '李四', phone: '138-0000-0002', email: 'lisi@example.com', address: '上海市浦东新区陆家嘴环路100号', group: '朋友', avatar: '👩' },
  { id: '3', name: '王五', phone: '138-0000-0003', email: 'wangwu@example.com', address: '广州市天河区珠江新城华夏路8号', group: '同事', avatar: '👨‍💼' },
  { id: '4', name: '赵六', phone: '138-0000-0004', email: 'zhaoliu@example.com', address: '深圳市南山区科技园南路1号', group: '家人', avatar: '👩‍💻' },
  { id: '5', name: '孙七', phone: '138-0000-0005', email: 'sunqi@example.com', address: '杭州市西湖区文三路478号', group: '朋友', avatar: '👨‍🎓' },
  { id: '6', name: '周八', phone: '138-0000-0006', email: 'zhouba@example.com', address: '成都市武侯区天府大道北段28号', group: '同事', avatar: '👩‍🎨' },
  { id: '7', name: '吴九', phone: '138-0000-0007', email: 'wujiu@example.com', address: '南京市鼓楼区中山北路200号', group: '家人', avatar: '👨‍🔧' },
  { id: '8', name: '郑十', phone: '138-0000-0008', email: 'zhengshi@example.com', address: '武汉市武昌区中南路99号', group: '朋友', avatar: '👩‍🔬' },
  { id: '9', name: '冯十一', phone: '138-0000-0009', email: 'fengshiyi@example.com', address: '西安市雁塔区高新路61号', group: '同事', avatar: '👨‍🏫' },
  { id: '10', name: '陈十二', phone: '138-0000-0010', email: 'chenshier@example.com', address: '长沙市岳麓区麓山南路932号', group: '家人', avatar: '👩‍🎓' },
]

export default function Contacts() {
  const { theme } = useStore()
  const isDark = theme === 'dark'
  const [contacts, setContacts] = useState<ContactData[]>(presetContacts)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<Omit<ContactData, 'id'>>({ name: '', phone: '', email: '', address: '', group: '朋友', avatar: '👤' })

  const bg = isDark ? '#1a1a2e' : '#f0f0f0'
  const sidebarBg = isDark ? '#16213e' : '#e0e0e0'
  const textColor = isDark ? '#e0e0e0' : '#333'
  const inputBg = isDark ? '#0f3460' : '#fff'
  const borderColor = isDark ? '#2a2a4a' : '#ccc'
  const selectedBg = isDark ? '#0f3460' : '#c8e6c9'
  const cardBg = isDark ? '#1a3a5c' : '#fff'

  const groups = ['全部', '同事', '朋友', '家人']
  const [activeGroup, setActiveGroup] = useState('全部')

  const filtered = contacts.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) || c.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchGroup = activeGroup === '全部' || c.group === activeGroup
    return matchSearch && matchGroup
  })

  const selected = contacts.find((c) => c.id === selectedId)

  const resetForm = () => setForm({ name: '', phone: '', email: '', address: '', group: '朋友', avatar: '👤' })

  const handleAdd = () => {
    if (!form.name.trim() || !form.phone.trim()) return
    const newContact: ContactData = { ...form, id: `c${Date.now()}`, name: form.name.trim(), phone: form.phone.trim() }
    setContacts([...contacts, newContact])
    setShowAdd(false)
    resetForm()
  }

  const handleEdit = () => {
    if (!editingId || !form.name.trim()) return
    setContacts(contacts.map((c) => (c.id === editingId ? { ...c, ...form } : c)))
    setEditingId(null)
    resetForm()
  }

  const handleDelete = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const startEdit = (contact: ContactData) => {
    setEditingId(contact.id)
    setForm({ name: contact.name, phone: contact.phone, email: contact.email, address: contact.address, group: contact.group, avatar: contact.avatar })
    setShowAdd(false)
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: bg, color: textColor, fontFamily: 'system-ui, sans-serif', fontSize: 13 }}>
      <div style={{ width: 260, background: sidebarBg, borderRight: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: 10 }}>
          <input
            type="text" placeholder="搜索联系人..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${borderColor}`, background: inputBg, color: textColor, fontSize: 12, boxSizing: 'border-box', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 4, padding: '0 10px 8px', flexWrap: 'wrap' }}>
          {groups.map((g) => (
            <span key={g} onClick={() => setActiveGroup(g)} style={{
              padding: '3px 10px', borderRadius: 12, cursor: 'pointer', fontSize: 11,
              background: activeGroup === g ? (isDark ? '#0f3460' : '#1976d2') : (isDark ? '#1a3a5c' : '#ddd'),
              color: activeGroup === g ? '#fff' : textColor,
            }}>{g}</span>
          ))}
        </div>
        <button onClick={() => { setShowAdd(true); setEditingId(null); resetForm() }} style={{
          margin: '0 10px 8px', padding: '6px 12px', borderRadius: 6, border: 'none',
          background: isDark ? '#0f3460' : '#1976d2', color: '#fff', cursor: 'pointer', fontSize: 12,
        }}>+ 添加联系人</button>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {filtered.map((c) => (
            <div key={c.id} onClick={() => { setSelectedId(c.id); setShowAdd(false); setEditingId(null) }} style={{
              padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              background: selectedId === c.id ? selectedBg : 'transparent',
              borderLeft: selectedId === c.id ? `3px solid ${isDark ? '#4fc3f7' : '#1976d2'}` : '3px solid transparent',
            }}>
              <span style={{ fontSize: 24 }}>{c.avatar}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: isDark ? '#9ca3af' : '#888' }}>{c.phone}</div>
              </div>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 8, background: isDark ? '#0f3460' : '#e3f2fd', color: isDark ? '#4fc3f7' : '#1976d2' }}>{c.group}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {(showAdd || editingId) ? (
          <div style={{ maxWidth: 400, margin: '0 auto', background: cardBg, borderRadius: 10, padding: 20, border: `1px solid ${borderColor}` }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>{editingId ? '编辑联系人' : '添加联系人'}</h3>
            {['name', 'phone', 'email', 'address'].map((field) => (
              <div key={field} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, marginBottom: 3, color: isDark ? '#9ca3af' : '#666' }}>
                  {field === 'name' ? '姓名' : field === 'phone' ? '电话' : field === 'email' ? '邮箱' : '地址'}
                </div>
                <input value={(form as any)[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${borderColor}`, background: inputBg, color: textColor, fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, marginBottom: 3, color: isDark ? '#9ca3af' : '#666' }}>分组</div>
              <select value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${borderColor}`, background: inputBg, color: textColor, fontSize: 13, outline: 'none' }}>
                {['同事', '朋友', '家人'].map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={editingId ? handleEdit : handleAdd} style={{ flex: 1, padding: '8px', borderRadius: 6, border: 'none', background: isDark ? '#0f3460' : '#1976d2', color: '#fff', cursor: 'pointer', fontSize: 13 }}>
                {editingId ? '保存' : '添加'}
              </button>
              <button onClick={() => { setShowAdd(false); setEditingId(null); resetForm() }} style={{ flex: 1, padding: '8px', borderRadius: 6, border: `1px solid ${borderColor}`, background: 'transparent', color: textColor, cursor: 'pointer', fontSize: 13 }}>取消</button>
            </div>
          </div>
        ) : selected ? (
          <div style={{ maxWidth: 400, margin: '0 auto', background: cardBg, borderRadius: 10, padding: 20, border: `1px solid ${borderColor}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 48 }}>{selected.avatar}</span>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{selected.name}</div>
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 10, background: isDark ? '#0f3460' : '#e3f2fd', color: isDark ? '#4fc3f7' : '#1976d2' }}>{selected.group}</span>
              </div>
            </div>
            {[
              { label: '📞 电话', value: selected.phone },
              { label: '📧 邮箱', value: selected.email },
              { label: '📍 地址', value: selected.address },
            ].map((item) => (
              <div key={item.label} style={{ padding: '10px 0', borderBottom: `1px solid ${borderColor}` }}>
                <div style={{ fontSize: 11, color: isDark ? '#9ca3af' : '#666', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 13 }}>{item.value}</div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => startEdit(selected)} style={{ flex: 1, padding: '8px', borderRadius: 6, border: 'none', background: isDark ? '#0f3460' : '#1976d2', color: '#fff', cursor: 'pointer', fontSize: 13 }}>编辑</button>
              <button onClick={() => handleDelete(selected.id)} style={{ flex: 1, padding: '8px', borderRadius: 6, border: `1px solid ${isDark ? '#e53935' : '#d32f2f'}`, background: 'transparent', color: isDark ? '#e53935' : '#d32f2f', cursor: 'pointer', fontSize: 13 }}>删除</button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', paddingTop: 80, color: isDark ? '#9ca3af' : '#999', fontSize: 14 }}>
            选择一个联系人查看详情
          </div>
        )}
      </div>
    </div>
  )
}