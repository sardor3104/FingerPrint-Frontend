import React, { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminApi, Employee } from '@/api/admin'

const AnalyticsDashboard = () => {
  const [logs, setLogs] = useState<any[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(true)

  const fetchData = async () => {
    setAnalyticsLoading(true)
    try {
      const [empData, logsData] = await Promise.all([
        adminApi.getEmployees(),
        adminApi.getDailyAnalytics()
      ])
      setEmployees(empData)
      setLogs(logsData)
    } catch (e) {
      console.error(e)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getHourlyPresence = () => {
    const presenceMap: Record<string, { name: string, hours: boolean[] }> = {};
    employees.forEach(emp => {
      presenceMap[emp.id] = { name: emp.full_name, hours: new Array(24).fill(false) };
    });

    Object.keys(presenceMap).forEach(empId => {
      const empLogs = logs.filter(l => {
        const logEmpId = typeof l.employee_id === 'string' ? l.employee_id : l.employee_id?.id;
        return logEmpId === empId && l.success;
      }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      const intervals: { start: number, end: number }[] = [];
      let checkInTime: Date | null = null;
      const currentHour = new Date().getHours();

      for (const log of empLogs) {
        const time = new Date(log.timestamp);
        if (log.event_type === 'check_in') {
          checkInTime = time;
        } else if (log.event_type === 'check_out' && checkInTime) {
          intervals.push({ start: checkInTime.getHours(), end: time.getHours() });
          checkInTime = null;
        }
      }

      if (checkInTime) {
        intervals.push({ start: checkInTime.getHours(), end: currentHour });
      }

      intervals.forEach(interval => {
        for (let i = interval.start; i <= interval.end; i++) {
          presenceMap[empId].hours[i] = true;
        }
      });
    });

    return Object.values(presenceMap);
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in zoom-in duration-200">
        <Card className="border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Kunlik Davomat va Soatlik Analitika</CardTitle>
              <CardDescription>Xodimlarning bugungi soatlik ishda bo'lgan vaqtlari (08:00 dan 18:00 gacha)</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <Activity className={cn("mr-2 h-4 w-4", analyticsLoading && "animate-spin")} /> Yangilash
            </Button>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="text-center py-8 text-muted-foreground animate-pulse">Ma'lumotlar yuklanmoqda...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="py-3 text-left font-medium min-w-[150px]">Xodim</th>
                      {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(hour => (
                        <th key={hour} className="py-3 text-center font-medium min-w-[40px] text-xs">
                          {hour.toString().padStart(2, '0')}:00
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {getHourlyPresence().map((row, idx) => (
                      <tr key={idx} className="hover:bg-accent/10 transition-colors">
                        <td className="py-3 font-medium whitespace-nowrap">{row.name}</td>
                        {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(hour => (
                          <td key={hour} className="py-2 text-center">
                            <div className={cn(
                              "h-6 w-full rounded-sm transition-all duration-300 mx-auto max-w-[30px]",
                              row.hours[hour] ? "bg-green-500 shadow-sm shadow-green-500/20 scale-105" : "bg-accent"
                            )} title={row.hours[hour] ? "Ishda" : "Yo'q"} />
                          </td>
                        ))}
                      </tr>
                    ))}
                    {getHourlyPresence().length === 0 && (
                      <tr><td colSpan={12} className="text-center py-6 text-muted-foreground">Hech qanday ma'lumot yo'q</td></tr>
                    )}
                  </tbody>
                </table>
                <div className="mt-6 flex items-center space-x-4 text-xs text-muted-foreground justify-end">
                  <div className="flex items-center space-x-1.5">
                    <div className="h-3 w-3 rounded-sm bg-green-500"></div>
                    <span>Ishda / Kelgan</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="h-3 w-3 rounded-sm bg-accent"></div>
                    <span>Yo'q / Ketgan</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

export default AnalyticsDashboard
