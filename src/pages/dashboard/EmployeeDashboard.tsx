import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/authStore'
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Fingerprint,
  MessageSquare,
  X,
  CalendarCheck,
  CalendarDays
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { attendanceApi, EmployeeStats, AttendanceHistoryItem } from '@/api/attendance'
import { permissionsApi, PermissionRequest } from '@/api/permissions'
import { toast } from 'sonner'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, CartesianGrid
} from 'recharts'
import { convertToUzbekTime } from '@/lib/date-utils'
import { format } from 'date-fns'

const EmployeeDashboard = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [statsData, setStatsData] = useState<EmployeeStats | null>(null)
  const [historyData, setHistoryData] = useState<AttendanceHistoryItem[]>([])
  const [myRequests, setMyRequests] = useState<PermissionRequest[]>([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [activeChart, setActiveChart] = useState<'weekly' | 'monthly' | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Request Form
  const [reqType, setReqType] = useState('kunlik')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [stats, history, reqs] = await Promise.all([
          attendanceApi.getMyStats(),
          attendanceApi.getMyHistory(),
          permissionsApi.getMyRequests()
        ])
        setStatsData(stats)
        setHistoryData(history)
        setMyRequests(reqs)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        toast.error('Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate || !reason) {
      toast.error("Iltimos, barcha maydonlarni to'ldiring")
      return
    }
    
    setIsSubmitting(true)
    try {
      const newReq = await permissionsApi.createRequest({
        type: reqType,
        start_time: new Date(startDate).toISOString(),
        end_time: new Date(endDate).toISOString(),
        reason
      })
      setMyRequests([newReq, ...myRequests])
      setShowRequestModal(false)
      setStartDate('')
      setEndDate('')
      setReason('')
      toast.success("Ruxsat so'rovi muvaffaqiyatli yuborildi")
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Xatolik yuz berdi")
    } finally {
      setIsSubmitting(false)
    }
  }

  const stats = [
    {
      id: 'last_check_in',
      name: 'O\'xirgi Check-in',
      value: statsData?.last_check_in 
        ? convertToUzbekTime(format(new Date(), 'MMM dd'), statsData.last_check_in).time 
        : '--:--',
      icon: Clock,
      color: 'text-blue-500',
      clickable: false
    },
    {
      id: 'weekly',
      name: 'Haftalik Davomat',
      value: statsData?.weekly_attendance || '--%',
      icon: CheckCircle2,
      color: 'text-green-500',
      clickable: true
    },
    {
      id: 'failed_attempts',
      name: 'Muvaffaqiyatsiz',
      value: statsData?.failed_attempts || '0',
      icon: AlertCircle,
      color: 'text-red-500',
      clickable: false
    },
    {
      id: 'monthly',
      name: 'Oylik Trend',
      value: statsData?.monthly_trend || '--%',
      icon: TrendingUp,
      color: 'text-emerald-500',
      clickable: true
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-500'
      case 'denied': return 'bg-red-500/10 text-red-500'
      default: return 'bg-yellow-500/10 text-yellow-500'
    }
  }
  
  const formatDateRange = (start: string, end: string) => {
    try {
      const s = new Date(start)
      const e = new Date(end)
      return `${s.toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} - ${e.toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
    } catch {
      return '--'
    }
  }

  return (
    <AppLayout>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card
            key={i}
            className={cn(
              "border-primary/10 transition-all",
              stat.clickable ? "cursor-pointer hover:shadow-lg hover:border-primary/40 hover:-translate-y-1" : ""
            )}
            onClick={() => {
              if (stat.id === 'weekly' || stat.id === 'monthly') {
                setActiveChart(stat.id as any)
              }
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <span className="animate-pulse bg-muted rounded h-8 w-16 inline-block"></span> : stat.value}
              </div>
              {stat.clickable && (
                <p className="text-[10px] text-muted-foreground mt-1">Grakfikni ko'rish uchun bosing</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-6">
        <Card className="md:col-span-4 border-primary/10">
          <CardHeader>
            <CardTitle>Davomat tarixi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg"></div>)}
                </div>
              ) : historyData.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground bg-accent/20 rounded-lg">
                  Ma'lumot topilmadi
                </div>
              ) : historyData.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 rounded-lg bg-accent/20 border border-border/50">
                  <div className="flex items-center space-x-4">
                    <div className={cn(
                      "p-2 rounded-full",
                      activity.type === 'Check-in' ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"
                    )}>
                      {activity.type === 'Check-in' ? <Fingerprint size={18} /> : <Clock size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{activity.type}</p>
                      {(() => {
                        const adjusted = convertToUzbekTime(activity.date, activity.time)
                        return (
                          <p className="text-xs text-muted-foreground">{adjusted.date} at {adjusted.time}</p>
                        )
                      })()}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-semibold",
                      activity.status === 'Success' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                    )}>
                      {activity.status}
                    </span>
                  </div>
                </div>
              ))}

              <Button variant="outline" className="w-full" asChild>
                <Link to="/attendance">To'liq tarixni ko'rish</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border-primary/10 bg-primary/5 flex flex-col">
          <CardHeader>
            <CardTitle>Tezkor amallar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="p-6 border-2 border-dashed border-primary/30 rounded-xl flex flex-col items-center justify-center text-center space-y-4 hover:border-primary transition-colors cursor-pointer group">
              <div className="p-4 bg-primary/10 rounded-full group-hover:scale-110 transition-transform">
                <Fingerprint className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">Shaxsni tasdiqlash</h3>
                <p className="text-xs text-muted-foreground">Kunlik kirish yoki chiqish uchun barmoq izingizni skanerlang</p>
              </div>
              <Button asChild>
                <Link to="/biometric">Skanerni ochish</Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link to="/chat" className="flex items-center justify-center p-3 rounded-lg bg-card border hover:border-primary transition-colors cursor-pointer group space-x-2">
                <MessageSquare className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Jamoa chati</span>
              </Link>
              <div 
                onClick={() => setShowRequestModal(true)} 
                className="flex items-center justify-center p-3 rounded-lg bg-card border hover:border-primary transition-colors cursor-pointer group space-x-2"
              >
                <CalendarCheck className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Ruxsat so'rash</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="text-base flex items-center"><CalendarDays className="mr-2 h-4 w-4" /> Mening Ruxsatnomalarim</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse bg-muted h-20 rounded-lg"></div>
            ) : myRequests.length === 0 ? (
              <div className="text-center p-4 text-sm text-muted-foreground bg-accent/10 rounded-lg">
                Sizda hali ruxsat so'rovlari yo'q
              </div>
            ) : (
              <div className="space-y-3">
                {myRequests.map((req) => (
                  <div key={req.id} className="p-4 bg-accent/20 border rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold uppercase text-xs tracking-wider">{req.type}</span>
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", getStatusColor(req.status))}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{formatDateRange(req.start_time, req.end_time)}</p>
                      <p className="text-sm italic mt-1">"{req.reason}"</p>
                    </div>
                    {req.reviewed_by_name && (
                      <div className="text-xs text-muted-foreground bg-background px-3 py-1.5 rounded-md border text-center">
                        <div>Ko'rib chiqdi:</div>
                        <div className="font-bold">{req.reviewed_by_name}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-xl animate-in fade-in zoom-in duration-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Ruxsat so'rash</CardTitle>
                <CardDescription>Menejer yoki Admindan ishdan qolish yoki ketishga ruxsat so'rang</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowRequestModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ruxsat turi</label>
                  <select 
                    value={reqType} 
                    onChange={e => setReqType(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="kunlik">Kunlik (1 kun yoki ko'proq)</option>
                    <option value="soatlik">Soatlik (bir necha soatga)</option>
                    <option value="masofaviy">Masofaviy ish (Uyda ishlash)</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Boshlanish vaqti</label>
                    <Input 
                      type={reqType === 'soatlik' ? 'datetime-local' : 'date'}
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tugash vaqti</label>
                    <Input 
                      type={reqType === 'soatlik' ? 'datetime-local' : 'date'}
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sabab</label>
                  <Input 
                    placeholder="Nima maqsadda so'rayapsiz?" 
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    required
                  />
                </div>

                <Button className="w-full" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Yuborilmoqda..." : "So'rov yuborish"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart Modals */}
      {activeChart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-2xl shadow-xl animate-in fade-in zoom-in duration-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {activeChart === 'weekly' ? 'Haftalik Davomat Grafikasi' : 'Oylik Trend Grafikasi'}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setActiveChart(null)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full mt-4">
                {activeChart === 'weekly' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData?.charts.weekly || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                      <RechartsTooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        cursor={{ fill: 'hsl(var(--muted))' }}
                      />
                      <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} name="Davomat (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={statsData?.charts.monthly || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Kunlar soni" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppLayout>
  )
}

export default EmployeeDashboard
