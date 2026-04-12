import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { attendanceApi, AttendanceHistoryItem } from '@/api/attendance'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  History,
  Search,
  Download,
  Calendar as CalendarIcon,
  Fingerprint,
  ArrowRight,
  Loader2,
  LogIn,
  LogOut,
  AlertTriangle
} from 'lucide-react'

const AttendanceHistory = () => {
  const [history, setHistory] = useState<AttendanceHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      try {
        const data = await attendanceApi.getMyHistory()
        setHistory(data)
      } catch (e) {
        toast.error('Tarixni yuklashda xato yuz berdi')
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  const filtered = history.filter((row) =>
    row.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getIcon = (type: string) => {
    if (type === 'Check-in') return <LogIn size={14} className="text-blue-500" />
    if (type === 'Check-out') return <LogOut size={14} className="text-purple-500" />
    return <AlertTriangle size={14} className="text-red-500" />
  }

  const getStatusStyle = (status: string) =>
    status === 'Success'
      ? 'bg-green-500/10 text-green-600'
      : 'bg-red-500/10 text-red-500'

  const handleExportCSV = () => {
    if (history.length === 0) { toast.info('Eksport qilish uchun ma\'lumot yo\'q'); return }
    const rows = [
      ['Sana', 'Turi', 'Vaqt', 'Status'],
      ...history.map((r) => [r.date, r.type, r.time, r.status])
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `attendance_history_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('CSV fayl yuklab olindi!')
  }

  return (
    <AppLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Card className="flex-1 border-primary/10 bg-accent/10">
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="p-2 bg-primary/20 rounded-lg text-primary">
                <History size={20} />
              </div>
              <div>
                <p className="text-sm font-medium">Tarixiy yozuvlar</p>
                <p className="text-xs text-muted-foreground">
                  {loading ? 'Yuklanmoqda...' : `Jami: ${history.length} ta yozuv`}
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download size={16} className="mr-2" /> CSV Eksport
            </Button>
          </div>
        </div>

        <Card className="border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Batafsil jurnal</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sana yoki turi bo'yicha..."
                className="pl-10 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={32} className="animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <History size={40} className="mb-3 opacity-20" />
                <p className="text-sm">Ma'lumot topilmadi</p>
                {searchQuery && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="text-xs mt-1"
                  >
                    Filterni tozalash
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                      <th className="text-left py-4 px-4">Sana</th>
                      <th className="text-left py-4 px-4">Turi</th>
                      <th className="text-left py-4 px-4">Vaqt</th>
                      <th className="text-left py-4 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map((row) => (
                      <tr key={row.id} className="hover:bg-accent/10 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <CalendarIcon size={14} className="text-primary/60" />
                            <span className="font-medium">{row.date}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            {getIcon(row.type)}
                            <span>{row.type}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-muted-foreground font-medium">
                          {row.time}
                        </td>
                        <td className="py-4 px-4">
                          <span className={cn(
                            'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase',
                            getStatusStyle(row.status)
                          )}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between items-center text-xs text-muted-foreground italic px-4">
          <p>* Barcha vaqtlar server vaqti (UTC+5) bo'yicha.</p>
          <div className="flex items-center">
            <Fingerprint size={12} className="mr-1" /> Biometrik tasdiqlangan yozuvlar
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default AttendanceHistory
