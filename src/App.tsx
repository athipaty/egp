import { useEffect, useState } from 'react'
import { getEgpRss, type EgpItem, type MaintenanceInfo } from './api'
import PhayaoHub from './PhayaoHub'

// anounceType codes from CGD e-GP RSS manual
const EGP_TYPES = [
  { key: 'D0', label: 'ประกาศเชิญชวน' },
  { key: 'P0', label: 'แผนการจัดซื้อ' },
  { key: 'W0', label: 'ประกาศผู้ชนะ' },
  { key: 'W2', label: 'แก้ไขประกาศผู้ชนะ' },
  { key: '15', label: 'ราคากลาง' },
  { key: 'B0', label: 'ร่างประกวดราคา' },
]

type Scope = 'local' | 'phayao'

function FeatureChip({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
      <span className="text-xl leading-none flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-white/75 mt-0.5 leading-snug">{desc}</p>
      </div>
    </div>
  )
}

function App() {
  const [scope, setScope] = useState<Scope>('local')
  const [anounceType, setAnounceType] = useState('D0')
  const [items, setItems] = useState<EgpItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [maintenance, setMaintenance] = useState<MaintenanceInfo | null>(null)
  const [staleAt, setStaleAt] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (scope !== 'local') return

    setLoading(true)
    setError('')
    setMaintenance(null)
    setStaleAt(null)
    setFetchedAt(null)

    getEgpRss(anounceType)
      .then((r) => {
        const d = r.data
        setItems(d.items || [])
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
  }, [scope, anounceType, tick])

  return (
    <div className="min-h-screen bg-[#fdf2f8]">
      {/* Hero / landing */}
      <header className="bg-gradient-to-br from-primary to-secondary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-14 sm:pb-16">
          <p className="text-[11px] sm:text-xs font-semibold tracking-widest text-white/80 uppercase">
            ระบบจัดซื้อจัดจ้างภาครัฐ
          </p>
          <h1 className="mt-2 text-2xl sm:text-4xl font-bold text-white leading-tight text-wrap-balance">
            e-GP พะเยา
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-white/90 max-w-xl leading-relaxed">
            ติดตามประกาศจัดซื้อจัดจ้างของ อบต.แม่ใส และทั่วทั้งจังหวัดพะเยา แบบเรียลไทม์ ในที่เดียว
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <FeatureChip icon="⚡" title="เรียลไทม์" desc="ดึงข้อมูลตรงจากระบบ e-GP ทันทีที่เปิดดู" />
            <FeatureChip icon="🗺️" title="ทั่วทั้งจังหวัด" desc="ครอบคลุมทุกหน่วยงานใน จ.พะเยา ไม่ใช่แค่ อบต.แม่ใส" />
            <FeatureChip icon="🔔" title="บันทึก & แจ้งเตือน" desc="บันทึกเงื่อนไขค้นหา รู้ทันทีที่มีประกาศใหม่ตรงเงื่อนไข" />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 sm:-mt-10 pb-12">
        <div className="flex gap-1.5 bg-white rounded-2xl shadow-lg shadow-primary/10 border border-gray-100 p-1.5 max-w-md">
          <button
            onClick={() => setScope('local')}
            className={`flex-1 px-3 py-2.5 text-sm rounded-xl font-medium transition-colors ${
              scope === 'local'
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
            }`}
          >
            อบต.แม่ใส
          </button>
          <button
            onClick={() => setScope('phayao')}
            className={`flex-1 px-3 py-2.5 text-sm rounded-xl font-medium transition-colors ${
              scope === 'phayao'
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
            }`}
          >
            จังหวัดพะเยา
          </button>
        </div>

        <div className="mt-4">

      {scope === 'phayao' && <PhayaoHub />}

      {scope === 'local' && (
      <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden bg-white">
          <div className="flex flex-wrap items-center gap-1.5 px-4 py-3 border-b border-gray-100 bg-gray-50">
            {EGP_TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setAnounceType(t.key)}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                  anounceType === t.key
                    ? 'bg-secondary text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-secondary hover:text-secondary'
                }`}
              >
                {t.label}
              </button>
            ))}
            <button
              onClick={() => setTick((n) => n + 1)}
              disabled={loading}
              title="ดึงข้อมูลใหม่"
              className="ml-auto flex items-center gap-1 text-xs text-gray-500 border border-gray-200 bg-white px-2.5 py-1 rounded-full hover:border-secondary hover:text-secondary transition-colors disabled:opacity-50"
            >
              <span className={loading ? 'animate-spin inline-block' : ''}>🔄</span> รีเฟรช
            </button>
          </div>

        {(fetchedAt || staleAt) && (
          <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100 text-[11px] text-gray-400 flex items-center gap-1.5">
            {staleAt ? (
              <>
                <span className="text-amber-500">⚠️ ข้อมูลแคช</span> · อัปเดตล่าสุด{' '}
                {new Date(staleAt).toLocaleString('th-TH')}
              </>
            ) : (
              <>
                <span className="text-green-600">✓ ข้อมูลล่าสุด</span> · ดึงข้อมูลเมื่อ{' '}
                {fetchedAt && new Date(fetchedAt).toLocaleString('th-TH')}
              </>
            )}
          </div>
        )}

        {maintenance && (
          <div className="flex items-start gap-3 mx-4 mt-4 mb-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="text-xl flex-shrink-0">🔧</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">ระบบ e-GP ปิดปรับปรุงชั่วคราว</p>
              <p className="text-xs text-amber-700 mt-0.5">
                {maintenance.notice || 'ระบบ e-GP ไม่พร้อมให้บริการในขณะนี้'}
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                เปิดให้บริการ {maintenance.hours || '17:01–08:59 น.'} (เว้นวันหยุดราชการ)
              </p>
              {staleAt && (
                <p className="text-[11px] text-amber-500 mt-1">
                  ℹ️ แสดงข้อมูลล่าสุดที่บันทึกไว้ เมื่อ {new Date(staleAt).toLocaleString('th-TH')}
                </p>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-10 text-center text-gray-400 text-sm animate-pulse">
            กำลังดึงข้อมูลจากระบบ e-GP...
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-red-500 text-sm font-medium">{error}</p>
            <p className="text-xs text-gray-400 mt-2">ระบบ e-GP เปิดให้บริการ 17:01–08:59 น. (เว้นวันหยุดราชการ)</p>
          </div>
        ) : items.length === 0 && !maintenance ? (
          <div className="p-10 text-center text-gray-400 text-sm">ไม่พบข้อมูลในขณะนี้</div>
        ) : items.length === 0 ? null : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 p-3">
            {items.map((item, i) => (
              <div
                key={item._id ?? item.link ?? i}
                className="rounded-xl border border-gray-100 p-3.5 hover:border-secondary/40 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 min-w-0 text-sm text-primary hover:text-secondary font-medium"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <span className="flex-1 min-w-0 text-sm text-gray-800 font-medium">{item.title}</span>
                  )}
                  <span className="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                    {item.date
                      ? new Date(item.date).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                          year: '2-digit',
                        })
                      : ''}
                  </span>
                </div>
                {item.desc && <p className="text-[11px] text-gray-400 mt-1 pl-7">{item.desc}</p>}
                {(item.winner || item.amount != null) && (
                  <div className="flex items-center gap-2 mt-1.5 pl-7">
                    <span className="flex-1 min-w-0 text-xs text-green-700 truncate">
                      {item.winner ? `🏆 ${item.winner}` : ''}
                    </span>
                    {item.amount != null && (
                      <span className="text-xs font-semibold text-blue-700 whitespace-nowrap flex-shrink-0">
                        {Number(item.amount).toLocaleString('th-TH')} บาท
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
          <a
            href="https://www.gprocurement.go.th/"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-secondary hover:underline"
          >
            ดูเพิ่มเติมที่ gprocurement.go.th →
          </a>
        </div>
      </div>
      )}
        </div>
      </main>
    </div>
  )
}

export default App
