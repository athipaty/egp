import { useEffect, useMemo, useState } from 'react'
import { getEgpPhayao, type EgpPhayaoParams, type EgpProject, type EgpProjectStatus, type MaintenanceInfo } from './api'
import { ANOUNCE_TYPE_GLOSSARY, describeMethod, daysUntil } from './glossary'
import {
  listSavedSearches,
  saveSearch,
  removeSavedSearch,
  markSeen,
  countNew,
  type SavedSearch,
} from './savedSearches'

const EGP_TYPES = [
  { key: 'D0', label: 'ประกาศเชิญชวน' },
  { key: 'P0', label: 'แผนการจัดซื้อ' },
  { key: 'W0', label: 'ประกาศผู้ชนะ' },
  { key: 'W2', label: 'แก้ไขประกาศผู้ชนะ' },
  { key: '15', label: 'ราคากลาง' },
  { key: 'B0', label: 'ร่างประกวดราคา' },
]

function typeLabel(key: string) {
  return EGP_TYPES.find((t) => t.key === key)?.label || key
}

function formatDate(dateStr: string | null) {
  return dateStr ? new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : ''
}

function StatusBadge({ status, days }: { status: EgpProjectStatus; days: number | null }) {
  if (status === 'open') {
    const label = days != null ? (days <= 0 ? 'ปิดวันนี้' : `เหลืออีก ${days} วัน`) : 'เปิดรับ'
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 whitespace-nowrap flex-shrink-0">{label}</span>
  }
  if (status === 'closed') {
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 whitespace-nowrap flex-shrink-0">ปิดรับแล้ว</span>
  }
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-400 whitespace-nowrap flex-shrink-0">ไม่ระบุกำหนด</span>
}

function ProjectCard({ project }: { project: EgpProject }) {
  const days = daysUntil(project.closingDate)
  const methodHint = describeMethod(project.method)

  return (
    <div className="px-4 py-3 hover:bg-pink-50/40 transition-colors">
      <div className="flex items-start gap-2">
        <a
          href={project.announcements[0]?.link}
          target="_blank"
          rel="noreferrer"
          className="flex-1 min-w-0 text-sm text-primary hover:text-secondary font-medium"
        >
          {project.title}
        </a>
        <StatusBadge status={project.status} days={days} />
      </div>

      {project.agency && <p className="text-[11px] text-gray-400 mt-1">{project.agency}</p>}

      {(project.amount != null || project.method || project.winner) && (
        <div className="flex items-center flex-wrap gap-2 mt-1.5">
          {project.amount != null && (
            <span className="text-xs font-semibold text-blue-700 whitespace-nowrap">
              {project.amount.toLocaleString('th-TH')} บาท
            </span>
          )}
          {project.method && (
            <span className="text-[11px] text-gray-500" title={methodHint || undefined}>
              {project.method}
            </span>
          )}
          {project.winner && <span className="text-xs text-green-700 truncate">🏆 {project.winner}</span>}
        </div>
      )}

      <div className="flex flex-wrap gap-1 mt-2">
        {project.announcements.map((a) => (
          <a
            key={a.link}
            href={a.link}
            target="_blank"
            rel="noreferrer"
            title={ANOUNCE_TYPE_GLOSSARY[a.anounceType]}
            className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 hover:bg-secondary hover:text-white transition-colors"
          >
            {typeLabel(a.anounceType)} · {formatDate(a.date)}
          </a>
        ))}
      </div>
    </div>
  )
}

function PhayaoHub() {
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<EgpProjectStatus | ''>('')
  const [amountInputs, setAmountInputs] = useState({ min: '', max: '' })
  const [appliedAmount, setAppliedAmount] = useState<{ min?: number; max?: number }>({})
  const [projects, setProjects] = useState<EgpProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [maintenance, setMaintenance] = useState<MaintenanceInfo | null>(null)
  const [staleAt, setStaleAt] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])

  const currentFilters: EgpPhayaoParams = useMemo(
    () => ({
      type: typeFilter || undefined,
      status: statusFilter || undefined,
      minAmount: appliedAmount.min,
      maxAmount: appliedAmount.max,
    }),
    [typeFilter, statusFilter, appliedAmount],
  )

  useEffect(() => {
    setSavedSearches(listSavedSearches())
  }, [])

  useEffect(() => {
    setLoading(true)
    setError('')
    setMaintenance(null)
    setStaleAt(null)
    setFetchedAt(null)

    getEgpPhayao(currentFilters)
      .then((r) => {
        const d = r.data
        setProjects(d.projects || [])
        if (d.stale) setStaleAt(d.staleAt || null)
        if (d.fetchedAt) setFetchedAt(d.fetchedAt)
        if (d.notice) setMaintenance({ maintenance: true, notice: d.notice })
      })
      .catch((err) => {
        const d = err?.response?.data || {}
        if (d.maintenance) setMaintenance({ maintenance: true, notice: d.notice, hours: d.hours })
        else setError(d.error || 'ไม่สามารถเชื่อมต่อระบบ e-GP ได้')
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter, appliedAmount, tick])

  const currentIds = projects.map((p) => p.projectId)
  const activeSaved = savedSearches.find((s) => JSON.stringify(s.filters) === JSON.stringify(currentFilters))
  const activeNewCount = activeSaved ? countNew(activeSaved, currentIds) : 0

  function handleApplyAmount() {
    const min = amountInputs.min.trim() ? Number(amountInputs.min) : undefined
    const max = amountInputs.max.trim() ? Number(amountInputs.max) : undefined
    setAppliedAmount({ min, max })
  }

  function handleSaveSearch() {
    const name = window.prompt('ตั้งชื่อการค้นหานี้ (เช่น "งานก่อสร้าง วงเงินน้อยกว่า 5 แสน")')
    if (!name?.trim()) return
    saveSearch(name.trim(), currentFilters)
    setSavedSearches(listSavedSearches())
  }

  function handleOpenSaved(s: SavedSearch) {
    setTypeFilter(s.filters.type || '')
    setStatusFilter(s.filters.status || '')
    setAmountInputs({
      min: s.filters.minAmount != null ? String(s.filters.minAmount) : '',
      max: s.filters.maxAmount != null ? String(s.filters.maxAmount) : '',
    })
    setAppliedAmount({ min: s.filters.minAmount, max: s.filters.maxAmount })
  }

  function handleMarkSeen(s: SavedSearch) {
    markSeen(s.id, currentIds)
    setSavedSearches(listSavedSearches())
  }

  function handleDeleteSaved(id: string) {
    removeSavedSearch(id)
    setSavedSearches(listSavedSearches())
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="flex items-center px-4 py-2 border-b border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-500">ประกาศจัดซื้อจัดจ้างทุกหน่วยงานใน จ.พะเยา รวมทุกขั้นตอนไว้ในการ์ดเดียว</p>
        <button
          onClick={() => setTick((n) => n + 1)}
          disabled={loading}
          title="ดึงข้อมูลใหม่"
          className="ml-auto flex items-center gap-1 text-xs text-gray-500 border border-gray-200 bg-white px-2.5 py-1 rounded-full hover:border-secondary hover:text-secondary transition-colors disabled:opacity-50 flex-shrink-0"
        >
          <span className={loading ? 'animate-spin inline-block' : ''}>🔄</span> รีเฟรช
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 px-4 py-3 border-b border-gray-100 bg-gray-50">
        <button
          onClick={() => setTypeFilter('')}
          className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
            typeFilter === '' ? 'bg-secondary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-secondary hover:text-secondary'
          }`}
        >
          ทั้งหมด
        </button>
        {EGP_TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => setTypeFilter(t.key)}
            title={ANOUNCE_TYPE_GLOSSARY[t.key]}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              typeFilter === t.key ? 'bg-secondary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-secondary hover:text-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-gray-100">
        <div className="flex gap-1">
          {(['', 'open', 'closed'] as const).map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 text-[11px] rounded-full font-medium transition-colors ${
                statusFilter === s ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
              }`}
            >
              {s === '' ? 'ทุกสถานะ' : s === 'open' ? 'เปิดรับ' : 'ปิดแล้ว'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 text-[11px]">
          <input
            type="number"
            placeholder="วงเงินต่ำสุด"
            value={amountInputs.min}
            onChange={(e) => setAmountInputs((v) => ({ ...v, min: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyAmount()}
            className="w-24 px-2 py-1 border border-gray-200 rounded-lg"
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            placeholder="วงเงินสูงสุด"
            value={amountInputs.max}
            onChange={(e) => setAmountInputs((v) => ({ ...v, max: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyAmount()}
            className="w-24 px-2 py-1 border border-gray-200 rounded-lg"
          />
          <button
            onClick={handleApplyAmount}
            className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
          >
            กรอง
          </button>
        </div>
        <button
          onClick={handleSaveSearch}
          className="ml-auto px-2.5 py-1 text-[11px] rounded-full bg-white border border-gray-200 text-gray-600 hover:border-secondary hover:text-secondary whitespace-nowrap"
        >
          + บันทึกการค้นหานี้
        </button>
      </div>

      {savedSearches.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-4 py-2 border-b border-gray-100 bg-gray-50/60">
          {savedSearches.map((s) => {
            const isActive = s === activeSaved
            const newCount = isActive ? activeNewCount : 0
            return (
              <span key={s.id} className="inline-flex items-center gap-1 text-[11px] bg-white border border-gray-200 rounded-full pl-2.5 pr-1 py-0.5">
                <button onClick={() => handleOpenSaved(s)} className="text-gray-600 hover:text-secondary">
                  {s.name}
                </button>
                {newCount > 0 && <span className="text-white bg-red-500 rounded-full px-1.5 leading-4">{newCount}</span>}
                {isActive && newCount > 0 && (
                  <button onClick={() => handleMarkSeen(s)} title="ทำเครื่องหมายว่าอ่านแล้ว" className="text-gray-400 hover:text-green-600 px-0.5">
                    ✓
                  </button>
                )}
                <button onClick={() => handleDeleteSaved(s.id)} title="ลบ" className="text-gray-300 hover:text-red-500 px-1">
                  ×
                </button>
              </span>
            )
          })}
        </div>
      )}

      {(fetchedAt || staleAt) && (
        <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100 text-[11px] text-gray-400 flex items-center gap-1.5">
          {staleAt ? (
            <>
              <span className="text-amber-500">⚠️ ข้อมูลแคช</span> · อัปเดตล่าสุด {new Date(staleAt).toLocaleString('th-TH')}
            </>
          ) : (
            <>
              <span className="text-green-600">✓ ข้อมูลล่าสุด</span> · ดึงข้อมูลเมื่อ {fetchedAt && new Date(fetchedAt).toLocaleString('th-TH')}
            </>
          )}
        </div>
      )}

      {maintenance && (
        <div className="flex items-start gap-3 mx-4 mt-4 mb-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <span className="text-xl flex-shrink-0">🔧</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">ระบบ e-GP ปิดปรับปรุงชั่วคราว</p>
            <p className="text-xs text-amber-700 mt-0.5">{maintenance.notice || 'ระบบ e-GP ไม่พร้อมให้บริการในขณะนี้'}</p>
            <p className="text-xs text-amber-600 mt-0.5">เปิดให้บริการ {maintenance.hours || '17:01–08:59 น.'} (เว้นวันหยุดราชการ)</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-10 text-center text-gray-400 text-sm animate-pulse">กำลังดึงข้อมูลจากระบบ e-GP...</div>
      ) : error ? (
        <div className="p-10 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-red-500 text-sm font-medium">{error}</p>
        </div>
      ) : projects.length === 0 && !maintenance ? (
        <div className="p-10 text-center text-gray-400 text-sm">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</div>
      ) : projects.length === 0 ? null : (
        <div className="divide-y divide-gray-50">
          {projects.map((p) => (
            <ProjectCard key={p.projectId} project={p} />
          ))}
        </div>
      )}

      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
        <a href="https://www.gprocurement.go.th/" target="_blank" rel="noreferrer" className="text-xs text-secondary hover:underline">
          ดูเพิ่มเติมที่ gprocurement.go.th →
        </a>
      </div>
    </div>
  )
}

export default PhayaoHub
