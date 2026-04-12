import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  Mail,
  MoreVertical,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { permissionsApi, PermissionRequest } from '@/api/permissions'
import { toast } from 'sonner'

const ManagerDashboard = () => {
  const [requests, setRequests] = useState<PermissionRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = async () => {
    try {
      const data = await permissionsApi.getTeamRequests()
      setRequests(data)
    } catch (e) {
      toast.error('Guruh so\'rovlarini yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleUpdateStatus = async (id: string, status: 'approved' | 'denied') => {
    try {
      const updated = await permissionsApi.updateStatus(id, status)
      setRequests(reqs => reqs.map(r => r.id === id ? updated : r))
      toast.success(`So'rov ${status === 'approved' ? 'tasdiqlandi' : 'rad etildi'}`)
    } catch (e) {
      toast.error("Xatolik yuz berdi")
    }
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length

  const stats = [
    { label: 'Pending Approvals', value: loading ? '-' : pendingCount.toString(), color: 'text-yellow-500' },
    { label: 'Team Attendance', value: '92%', color: 'text-green-500' },
    { label: 'Late Arrivals', value: '2', color: 'text-red-500' },
  ]

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
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {stats.map((stat, i) => (
          <Card key={i} className="border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-3xl font-bold", stat.color)}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle>Team Requests</CardTitle>
          <CardDescription>Review and approve pending requests from your team members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl"></div>)}
              </div>
            ) : requests.length === 0 ? (
               <div className="text-center p-8 text-muted-foreground bg-accent/10 rounded-xl">Hozircha jamoa so'rovlari yo'q</div>
            ) : requests.map((req) => (
              <div key={req.id} className="p-5 rounded-xl border border-border/50 bg-accent/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary shrink-0">
                    {req.employee_name.split(' ').map(n => n?.[0]).join('')?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{req.employee_name}</h4>
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">{req.type} &bull; {formatDateRange(req.start_time, req.end_time)}</p>
                    <p className="text-sm italic text-muted-foreground/80">"{req.reason}"</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2 shrink-0">
                  <div className="flex items-center space-x-2">
                    {req.status === 'pending' ? (
                      <>
                        <Button onClick={() => handleUpdateStatus(req.id, 'denied')} variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive/10">
                          <XCircle className="mr-2 h-4 w-4" /> Reject
                        </Button>
                        <Button onClick={() => handleUpdateStatus(req.id, 'approved')} size="sm" className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="mr-2 h-4 w-4" /> Approve
                        </Button>
                      </>
                    ) : (
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold uppercase",
                        req.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      )}>
                        {req.status}
                      </span>
                    )}
                  </div>
                  {req.reviewed_by_name && (
                    <div className="text-[10px] text-muted-foreground border px-2 py-0.5 rounded bg-background shadow-sm">
                      Ko'rib chiqdi: <strong>{req.reviewed_by_name}</strong>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="text-base flex items-center"><Calendar className="mr-2 h-4 w-4" /> Team Calendar</CardTitle>
          </CardHeader>
          <CardContent className="h-48 flex items-center justify-center bg-accent/10 rounded-lg text-muted-foreground italic">
            Calendar View Integrated Here
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="text-base flex items-center"><FileText className="mr-2 h-4 w-4" /> Quick Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="ghost" className="w-full justify-between text-sm h-12 border border-dashed rounded-xl px-4">
              <span>Weekly Team Attendance Summary</span>
              <Mail className="h-4 w-4 text-primary" />
            </Button>
            <Button variant="ghost" className="w-full justify-between text-sm h-12 border border-dashed rounded-xl px-4">
              <span>System Compliance Audit (Current Month)</span>
              <Clock className="h-4 w-4 text-primary" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

export default ManagerDashboard
