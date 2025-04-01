import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function Statistics() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    topProducts: [],
    averageOrderValue: 0,
    largestOrder: { amount: 0, orderId: '' },
    averageTableTime: 0,
    totalRevenue: 0,
    dailySales: [],
    weeklySales: [],
    monthlySales: [],
    hourlyDistribution: [],
    customerRetention: 0,
    tableUtilization: 0,
    topCategories: [],
    itemPairings: [],
    pendingOrders: 0,
    completedOrders: 0,
  })
  const [timeRange, setTimeRange] = useState('month') // 'day', 'week', 'month', 'year'

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
    if (status === 'authenticated') {
      fetchStatistics()
    }
  }, [status, timeRange])

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/statistics?timeRange=${timeRange}`)

      if (!res.ok) {
        throw new Error(`Eroare la obținerea statisticilor: ${res.status}`)
      }

      const data = await res.json()
      setStats(data)
      setError('')
    } catch (err) {
      console.error('Eroare la obținerea statisticilor:', err)
      setError('Nu s-au putut încărca datele statistice')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
    }).format(amount)
  }

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#31E981] mb-4"></div>
        <span className="ml-3 text-white">Se încarcă statisticile...</span>
      </div>
    )
  }

  console.log(stats.topCategories)

  return (
    <div className="py-8 px-6 min-w-[70%] max-w-[70%]">
      <Head>
        <title>Statistici Restaurant</title>
      </Head>

      <h1 className="text-3xl font-bold text-white mb-8">
        Tabloul de Bord Analitic pentru Restaurant
      </h1>

      {error && (
        <div className="bg-red-900/30 text-red-200 p-6 rounded-lg border border-red-800 mb-8">
          <p>{error}</p>
          <button
            onClick={fetchStatistics}
            className="mt-4 px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-md transition-colors"
          >
            Încearcă din nou
          </button>
        </div>
      )}

      <div className="mb-6">
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setTimeRange('day')}
            className={`px-4 py-2 rounded-md transition-colors ${
              timeRange === 'day'
                ? 'bg-[#31E981] text-black font-semibold'
                : 'bg-black text-white border border-gray-700 hover:border-[#31E981]'
            }`}
          >
            Astăzi
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded-md transition-colors ${
              timeRange === 'week'
                ? 'bg-[#31E981] text-black font-semibold'
                : 'bg-black text-white border border-gray-700 hover:border-[#31E981]'
            }`}
          >
            Săptămâna aceasta
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded-md transition-colors ${
              timeRange === 'month'
                ? 'bg-[#31E981] text-black font-semibold'
                : 'bg-black text-white border border-gray-700 hover:border-[#31E981]'
            }`}
          >
            Luna aceasta
          </button>
          <button
            onClick={() => setTimeRange('year')}
            className={`px-4 py-2 rounded-md transition-colors ${
              timeRange === 'year'
                ? 'bg-[#31E981] text-black font-semibold'
                : 'bg-black text-white border border-gray-700 hover:border-[#31E981]'
            }`}
          >
            Anul acesta
          </button>
        </div>
      </div>

      {/* Metrici principale */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Venituri totale */}
        <div className="bg-black rounded-lg p-6 border border-[#35605a] shadow">
          <h3 className="text-[#31E981] text-sm uppercase font-semibold mb-1">
            Venituri Totale
          </h3>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(stats.totalRevenue || 0)}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Pentru perioada selectată
          </p>
        </div>

        {/* Valoarea medie a comenzii */}
        <div className="bg-black rounded-lg p-6 border border-[#35605a] shadow">
          <h3 className="text-[#31E981] text-sm uppercase font-semibold mb-1">
            Comandă Medie
          </h3>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(stats.averageOrderValue || 0)}
          </p>
          <p className="text-sm text-gray-400 mt-1">Media per comandă</p>
        </div>

        {/* Stare comenzi */}
        <div className="bg-black rounded-lg p-6 border border-[#35605a] shadow">
          <h3 className="text-[#31E981] text-sm uppercase font-semibold mb-1">
            Finalizare Comenzi
          </h3>
          <p className="text-2xl font-bold text-white">
            {stats.completedOrders || 0} /{' '}
            {(stats.completedOrders || 0) + (stats.pendingOrders || 0)}
          </p>
          <p className="text-sm text-gray-400 mt-1">Comenzi finalizate</p>
        </div>

        {/* Timp mediu la masă */}
        <div className="bg-black rounded-lg p-6 border border-[#35605a] shadow">
          <h3 className="text-[#31E981] text-sm uppercase font-semibold mb-1">
            Timp Mediu la Masă
          </h3>
          <p className="text-2xl font-bold text-white">
            {formatTime(stats.averageTableTime || 0)}
          </p>
          <p className="text-sm text-gray-400 mt-1">Durata medie de servire</p>
        </div>
      </div>

      {/* Layout cu două coloane pentru statistici detaliate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Coloana stângă */}
        <div className="space-y-8">
          {/* Produse populare */}
          <div className="bg-black rounded-lg p-6 border border-[#35605a] shadow">
            <h3 className="text-xl font-bold text-white mb-4">
              Cele Mai Populare Produse
            </h3>
            <div className="space-y-4">
              {stats.topProducts && stats.topProducts.length > 0 ? (
                stats.topProducts.map((product, index) => (
                  <div key={product.id || index} className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-[#35605a] flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">{index + 1}</span>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-white font-medium">{product.name}</p>
                      <div className="mt-1 w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-[#31E981] h-2 rounded-full"
                          style={{
                            width: `${
                              (product.quantity /
                                (stats.topProducts[0]?.quantity || 1)) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <span className="ml-4 text-white font-semibold">
                      {product.quantity} vândute
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">Nu există date disponibile</p>
              )}
            </div>
          </div>

          {/* Cea mai mare comandă */}
          <div className="bg-black rounded-lg p-6 border border-[#35605a] shadow">
            <h3 className="text-xl font-bold text-white mb-4">
              Cea Mai Mare Comandă
            </h3>
            {stats.largestOrder && stats.largestOrder.orderId ? (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-2xl font-bold text-[#31E981]">
                    {formatCurrency(stats.largestOrder.amount)}
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  Aceasta reprezintă comanda cu cea mai mare valoare din
                  perioada selectată
                </p>
              </div>
            ) : (
              <p className="text-gray-400">Nu există date disponibile</p>
            )}
          </div>

          {/* Categorii populare */}
          <div className="bg-black rounded-lg p-6 border border-[#35605a] shadow">
            <h3 className="text-xl font-bold text-white mb-4">
              Categorii Populare
            </h3>
            <div className="space-y-3">
              {stats.topCategories && stats.topCategories.length > 0 ? (
                stats.topCategories.map((category, index) => (
                  <div
                    key={category.id || index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-white">{category.name}</span>
                    <div className="flex items-center">
                      <span className="text-white mr-3">
                        {Math.round(category.percentage)}%
                      </span>
                      <div className="w-24 bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-[#31E981] h-2 rounded-full"
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">Nu există date disponibile</p>
              )}
            </div>
          </div>
        </div>

        {/* Coloana dreaptă */}
        <div className="space-y-8">
          {/* Vânzări în timp */}
          <div className="bg-black rounded-lg p-6 border border-[#35605a] shadow">
            <h3 className="text-xl font-bold text-white mb-4 whitespace-normal">
              {timeRange === 'day' &&
                'Vânzările din Orele de Funcționare (06:00-00:00)'}
              {timeRange === 'week' && 'Vânzările din Această Săptămână'}
              {timeRange === 'month' && 'Vânzările din Această Lună'}
              {timeRange === 'year' && 'Vânzările din Acest An'}
            </h3>
            <div className="h-64 flex items-end space-x-2">
              {timeRange === 'day' &&
                stats.hourlySales &&
                stats.hourlySales
                  .filter((item) => {
                    const hour = parseInt(item.label.split(':')[0])
                    return hour >= 6 || hour === 0
                  })
                  .map((item, index) => (
                    <div
                      key={index}
                      className="flex-1 min-w-[14px] flex flex-col items-center"
                    >
                      <div
                        className="w-full bg-[#35605a] hover:bg-[#31E981] transition-colors rounded-t"
                        style={{
                          height: `${
                            (item.amount /
                              (Math.max(
                                ...stats.hourlySales
                                  .filter((i) => {
                                    const hour = parseInt(i.label.split(':')[0])
                                    return hour >= 6 || hour === 0
                                  })
                                  .map((i) => i.amount)
                              ) || 1)) *
                            100
                          }%`,
                          minHeight: item.amount > 0 ? '4px' : '0',
                        }}
                      ></div>
                      <p
                        className="text-xs text-gray-400 mt-2 whitespace-nowrap transform rotate-45 origin-top-left translate-y-2"
                        style={{ fontSize: '0.65rem' }}
                      >
                        {item.label}
                      </p>
                    </div>
                  ))}

              {timeRange === 'week' &&
                stats.dailySales &&
                stats.dailySales.map((item, index) => (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center"
                  >
                    <div
                      className="w-full bg-[#35605a] hover:bg-[#31E981] transition-colors rounded-t"
                      style={{
                        height: `${
                          (item.amount /
                            (Math.max(
                              ...stats.dailySales.map((i) => i.amount)
                            ) || 1)) *
                          100
                        }%`,
                        minHeight: item.amount > 0 ? '4px' : '0',
                      }}
                    ></div>
                    <p className="text-xs text-gray-400 mt-2">{item.label}</p>
                  </div>
                ))}

              {timeRange === 'month' &&
                stats.weeklySales &&
                stats.weeklySales.map((item, index) => (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center"
                  >
                    <div
                      className="w-full bg-[#35605a] hover:bg-[#31E981] transition-colors rounded-t"
                      style={{
                        height: `${
                          (item.amount /
                            (Math.max(
                              ...stats.weeklySales.map((i) => i.amount)
                            ) || 1)) *
                          100
                        }%`,
                        minHeight: item.amount > 0 ? '4px' : '0',
                      }}
                    ></div>
                    <p className="text-xs text-gray-400 mt-2">{item.label}</p>
                  </div>
                ))}

              {timeRange === 'year' &&
                stats.monthlySales &&
                stats.monthlySales.map((item, index) => (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center"
                  >
                    <div
                      className="w-full bg-[#35605a] hover:bg-[#31E981] transition-colors rounded-t"
                      style={{
                        height: `${
                          (item.amount /
                            (Math.max(
                              ...stats.monthlySales.map((i) => i.amount)
                            ) || 1)) *
                          100
                        }%`,
                        minHeight: item.amount > 0 ? '4px' : '0',
                      }}
                    ></div>
                    <p className="text-xs text-gray-400 mt-2">{item.label}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* Utilizarea meselor */}
          <div className="bg-black rounded-lg p-6 border border-[#35605a] shadow">
            <h3 className="text-xl font-bold text-white mb-4">
              Utilizarea Meselor
            </h3>
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#444"
                    strokeWidth="3"
                    strokeDasharray="100, 100"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#31E981"
                    strokeWidth="3"
                    strokeDasharray={`${stats.tableUtilization || 0}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold text-white">
                    {stats.tableUtilization || 0}%
                  </span>
                  <span className="text-xs text-gray-400">Utilizare</span>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-gray-400 mt-4">
              Procentajul mediu de mese ocupate în timpul programului
            </p>
          </div>

          {/* Asocieri populare */}
          <div className="bg-black rounded-lg p-6 border border-[#35605a] shadow">
            <h3 className="text-xl font-bold text-white mb-4">
              Combinații Populare
            </h3>
            <div className="space-y-3">
              {stats.itemPairings && stats.itemPairings.length > 0 ? (
                stats.itemPairings.map((pair, index) => (
                  <div
                    key={index}
                    className="border-b border-gray-800 pb-3 last:border-0"
                  >
                    <div className="flex justify-between">
                      <span className="text-white">
                        {pair.items.join(' + ')}
                      </span>
                      <span className="text-[#31E981] font-medium">
                        {pair.count}x comandate împreună
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">Nu există date disponibile</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ore de vârf */}
      <div className="mt-8 bg-black rounded-lg p-6 border border-[#35605a] shadow">
        <h3 className="text-xl font-bold text-white mb-6">Ore de Vârf</h3>
        <div className="h-48 flex items-end space-x-1">
          {stats.hourlyDistribution &&
            stats.hourlyDistribution
              .filter((hour) => {
                const hourNum = parseInt(hour.hour.split(':')[0])
                return hourNum >= 6 || hourNum === 0
              })
              .map((hour, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full rounded-t ${
                      hour.isPeak ? 'bg-[#31E981]' : 'bg-[#35605a]'
                    }`}
                    style={{
                      height: `${
                        (hour.percentage /
                          (Math.max(
                            ...stats.hourlyDistribution
                              .filter((h) => {
                                const hourNum = parseInt(h.hour.split(':')[0])
                                return hourNum >= 6 || hourNum === 0
                              })
                              .map((h) => h.percentage)
                          ) || 1)) *
                        100
                      }%`,
                      minHeight: hour.percentage > 0 ? '4px' : '0',
                    }}
                    title={`${hour.percentage}% din comenzi`}
                  ></div>
                  <p
                    className="text-xs text-gray-400 mt-2 whitespace-nowrap transform rotate-45 origin-top-left translate-y-2"
                    style={{ fontSize: '0.65rem' }}
                  >
                    {hour.hour}
                  </p>
                </div>
              ))}
        </div>
        <div className="h-6"></div>
        <p className="text-center text-sm text-gray-400 mt-8 pt-4">
          Graficul arată distribuția comenzilor în orele de funcționare
          (06:00-00:00)
        </p>
      </div>

      {/* Metrici de fidelizare a clienților */}
      <div className="mt-8 bg-black rounded-lg p-6 border border-[#35605a] shadow">
        <h3 className="text-xl font-bold text-white mb-4">
          Fidelizarea Clienților
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-4 bg-black/50 rounded-lg border border-gray-800">
            <h4 className="text-[#31E981] text-sm font-semibold">
              Mărimea Medie a Grupului
            </h4>
            <p className="text-2xl font-bold text-white mt-2">
              {stats.averagePartySize || 0}
            </p>
            <p className="text-xs text-gray-400 mt-1">Persoane per masă</p>
          </div>

          <div className="p-4 bg-black/50 rounded-lg border border-gray-800">
            <h4 className="text-[#31E981] text-sm font-semibold">
              Produse per Comandă
            </h4>
            <p className="text-2xl font-bold text-white mt-2">
              {stats.averageItemsPerOrder || 0}
            </p>
            <p className="text-xs text-gray-400 mt-1">Produse comandate</p>
          </div>
        </div>
      </div>
    </div>
  )
}
