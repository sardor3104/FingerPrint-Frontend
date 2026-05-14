import React, { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users, UserPlus, ShieldAlert, Activity,
  MoreHorizontal, Search, Fingerprint, Mail, UserCheck,
  Trash2, Settings, User, Lock, MapPin
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminApi, Employee } from '@/api/admin'
import { authApi } from '@/api/auth'
import { usersApi } from '@/api/users'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'

const AdminDashboard = () => {
  const currentUserId = useAuthStore(state => state.user?.id)
  const updateUser = useAuthStore(state => state.updateUser)

  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'employees' | 'settings'>('employees')

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const [editingUser, setEditingUser] = useState<Employee | null>(null)

  // Form states
  const [addForm, setAddForm] = useState({
    jshshir: '',
    full_name: '',
    birth_date: '',
    phone: '',
    email: '',
    password: '',
    role: 'employee',
    fingerprint_image_base64: ''
  })

  const [editForm, setEditForm] = useState({
    jshshir: '',
    full_name: '',
    email: '',
    phone: '',
    role: 'employee' as any,
    password: ''
  })

  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: ''
  })

  const [locationForm, setLocationForm] = useState({
    latitude: 0,
    longitude: 0,
    radius_meters: 100
  })

  const [locationLoading, setLocationLoading] = useState(false)

  // Mock alerts
  const alerts = [
    { id: 1, type: 'Muvaffaqiyatsiz urinish', message: 'B sektorida biometrik moslashuv xatosi', time: '10 daqiqa oldin', severity: 'high' },
    { id: 2, type: 'Yangi ro\'yxatdan o\'tish', message: 'Yangi xodim so\'rovi (ID: 105)', time: '2 soat oldin', severity: 'low' },
  ]

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getEmployees()
      setEmployees(data)
      
      // Update profile form with current user data
      const me = data.find(e => e.id === currentUserId)
      if (me) {
        setProfileForm({
          full_name: me.full_name,
          email: me.email,
          phone: me.phone,
          password: ''
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchLocation = async () => {
    setLocationLoading(true)
    try {
      const data = await adminApi.getOrgLocation()
      setLocationForm({
        latitude: data.latitude,
        longitude: data.longitude,
        radius_meters: data.radius_meters
      })
    } catch (e) {
      console.error('Failed to fetch location:', e)
    } finally {
      setLocationLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
    fetchLocation()
  }, [])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAddForm({ ...addForm, fingerprint_image_base64: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await authApi.register(addForm)
      toast.success('Foydalanuvchi muvaffaqiyatli qo\'shildi')
      setIsAddOpen(false)
      setAddForm({ jshshir: '', full_name: '', birth_date: '', phone: '', email: '', password: '', role: 'employee', fingerprint_image_base64: '' })
      fetchEmployees()
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      if (Array.isArray(detail)) {
        // Pydantic validation error
        toast.error(`Xato: ${detail[0]?.loc[detail[0]?.loc.length - 1]} - ${detail[0]?.msg}`);
      } else if (typeof detail === 'string') {
        toast.error(`Xato: ${detail}`);
      } else {
        toast.error('Xatolik yuz berdi. Iltimos barcha maydonlarni to\'g\'ri to\'ldiring.');
      }
    }
  }

  const openEditModal = (emp: Employee) => {
    setEditingUser(emp)
    setEditForm({
      jshshir: emp.jshshir,
      full_name: emp.full_name,
      email: emp.email,
      phone: emp.phone,
      role: emp.role,
      password: ''
    })
    setIsEditOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    try {
      const payload: any = { ...editForm }
      if (!payload.password) delete payload.password
      
      await adminApi.updateEmployee(editingUser.id, payload)
      toast.success('Ma\'lumotlar muvaffaqiyatli saqlandi')
      setIsEditOpen(false)
      setEditingUser(null)
      fetchEmployees()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Xatolik yuz berdi.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Haqiqatan ham o'chirmoqchimisiz?")) return;
    try {
      await adminApi.deleteEmployee(id);
      toast.success("Muvaffaqiyatli o'chirildi");
      fetchEmployees();
      setSelectedIds(prev => prev.filter(i => i !== id));
    } catch (err) {
      toast.error("Xatolik yuz berdi");
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`${selectedIds.length} foydalanuvchini o'chirmoqchimisiz?`)) return;
    
    let successCount = 0;
    for (const id of selectedIds) {
      try {
        await adminApi.deleteEmployee(id);
        successCount++;
      } catch (err) {
        console.error(`Failed to delete ${id}`);
      }
    }
    
    toast.success(`${successCount} foydalanuvchi o'chirildi`);
    fetchEmployees();
    setSelectedIds([]);
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload: any = { ...profileForm }
      if (!payload.password) delete payload.password
      
      const updated = await usersApi.updateMe(payload)
      updateUser(updated)
      toast.success('Profilingiz muvaffaqiyatli yangilandi')
      setProfileForm(prev => ({ ...prev, password: '' }))
    } catch (err) {
      toast.error('Profilingizni yangilashda xatolik yuz berdi')
    }
  }

  const handleLocationUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await adminApi.updateOrgLocation(locationForm)
      toast.success('Tashkilot lokatsiyasi muvaffaqiyatli yangilandi')
    } catch (err) {
      toast.error('Lokatsiyani yangilashda xatolik yuz berdi')
    }
  }

  const toggleSelect = (id: string) => {
    if (id === currentUserId) return; // Don't allow selecting self for deletion
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const filteredEmployees = employees.filter(e =>
    e.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AppLayout>
      <div className="flex space-x-4 mb-6 pt-2 overflow-x-auto pb-2 border-b border-primary/5">
        <button 
          onClick={() => setActiveTab('employees')}
          className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
            activeTab === 'employees' ? "bg-primary text-primary-foreground shadow-md" : "bg-accent/50 hover:bg-accent"
          )}
        >
          <Users size={16} /> <span>Xodimlarni Boshqarish</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
            activeTab === 'settings' ? "bg-primary text-primary-foreground shadow-md" : "bg-accent/50 hover:bg-accent"
          )}
        >
          <Settings size={16} /> <span>Profil Sozlamalari</span>
        </button>
      </div>

      {activeTab === 'employees' && (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 relative">
            {[
              { label: 'Jami xodimlar', value: employees.length, icon: Users, color: 'text-blue-500' },
              { label: 'Bugun kelganlar', value: '-', icon: UserCheck, color: 'text-green-500' },
              { label: 'Xavfsizlik ogohlantirishlari', value: '2', icon: ShieldAlert, color: 'text-red-500' },
              { label: 'Faol seanslar', value: '-', icon: Activity, color: 'text-purple-500' },
            ].map((stat, i) => (
              <Card key={i} className="border-primary/10">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3 mt-6">
            <Card className="lg:col-span-2 border-primary/10">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Xodimlar / Foydalanuvchilar</CardTitle>
                  <CardDescription>Barcha ro'yxatdan o'tgan foydalanuvchilar va ularning ma'lumotlari</CardDescription>
                </div>
                <div className="flex space-x-2">
                  {selectedIds.length > 0 && (
                    <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                      <Trash2 className="mr-2 h-4 w-4" /> ({selectedIds.length}) O'chirish
                    </Button>
                  )}
                  <Button size="sm" onClick={() => setIsAddOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" /> Yangi Qo'shish
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4 bg-accent/30 p-2 rounded-lg">
                  <Search className="h-4 w-4 text-muted-foreground ml-2" />
                  <Input
                    placeholder="Ism yoki email orqali qidirish..."
                    className="border-none bg-transparent focus-visible:ring-0"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  <Button variant="ghost" size="sm" onClick={fetchEmployees} title="Yangilash">
                    <Activity className={cn("h-4 w-4", loading && "animate-spin")} />
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="w-10 py-3 text-left">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300"
                            checked={selectedIds.length === filteredEmployees.filter(e => e.id !== currentUserId).length && filteredEmployees.length > 1}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds(filteredEmployees.filter(emp => emp.id !== currentUserId).map(emp => emp.id))
                              } else {
                                setSelectedIds([])
                              }
                            }}
                          />
                        </th>
                        <th className="text-left font-medium py-3">Foydalanuvchi</th>
                        <th className="text-left font-medium py-3">Rol</th>
                        <th className="text-left font-medium py-3">JSHSHIR</th>
                        <th className="text-right font-medium py-3 px-4">Harakatlar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {loading ? (
                        <tr><td colSpan={5} className="text-center py-4 text-muted-foreground">Yuklanmoqda...</td></tr>
                      ) : filteredEmployees.map((emp) => (
                        <tr key={emp.id} className={cn(
                          "hover:bg-accent/10 transition-colors border-b",
                          selectedIds.includes(emp.id) ? "bg-primary/5" : "",
                          emp.id === currentUserId ? "bg-blue-50/30" : ""
                        )}>
                          <td className="py-4">
                            {emp.id !== currentUserId && (
                              <input 
                                type="checkbox" 
                                className="rounded border-gray-300" 
                                checked={selectedIds.includes(emp.id)}
                                onChange={() => toggleSelect(emp.id)}
                              />
                            )}
                          </td>
                          <td className="py-4">
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                                {emp.full_name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium flex items-center">
                                  {emp.full_name}
                                  {emp.id === currentUserId && (
                                    <span className="ml-2 text-[10px] bg-blue-500 text-white font-bold px-2 py-0.5 rounded-full ring-2 ring-blue-200">
                                      Siz (Admin)
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground">{emp.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className={cn(
                              "px-2 py-1 rounded text-[10px] font-bold uppercase",
                              emp.role === 'admin' ? "bg-red-100 text-red-700" : 
                              emp.role === 'manager' ? "bg-amber-100 text-amber-700" : 
                              "bg-slate-100 text-slate-700"
                            )}>
                              {emp.role}
                            </span>
                          </td>
                          <td className="py-4 font-mono text-xs text-muted-foreground">{emp.jshshir}</td>
                          <td className="py-4 text-right space-x-2 flex justify-end">
                            <Button variant="ghost" size="sm" onClick={() => openEditModal(emp)}>Tahrirlash</Button>
                            {emp.id !== currentUserId && (
                              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(emp.id)}>O'chirish</Button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredEmployees.length === 0 && !loading && (
                        <tr><td colSpan={5} className="text-center py-4 text-muted-foreground">Foydalanuvchilar topilmadi</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-primary/10">
                <CardHeader>
                  <CardTitle>Tizim xabarlari</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <div key={alert.id} className={cn(
                        "p-3 rounded-lg border-l-4 flex space-x-3",
                        alert.severity === 'high' ? "bg-red-500/5 border-red-500" : "bg-blue-500/5 border-blue-500"
                      )}>
                        <div className={cn(
                          "mt-0.5",
                          alert.severity === 'high' ? "text-red-500" : "text-blue-500"
                        )}>
                          {alert.severity === 'high' ? <ShieldAlert size={16} /> : <Activity size={16} />}
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-tight">{alert.type}</p>
                          <p className="text-sm font-medium">{alert.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{alert.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}


      {activeTab === 'settings' && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 border-primary/10">
            <CardHeader>
              <CardTitle>Shaxsiy Ma'lumotlar</CardTitle>
              <CardDescription>O'z ma'lumotlaringizni va parolingizni shu yerdan o'zgartirishingiz mumkin.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">To'liq ism (F.I.SH.)</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        className="pl-9" 
                        value={profileForm.full_name} 
                        onChange={e => setProfileForm({...profileForm, full_name: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Email manzili</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        className="pl-9" 
                        value={profileForm.email} 
                        onChange={e => setProfileForm({...profileForm, email: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Telefon raqami</label>
                    <Input 
                      value={profileForm.phone} 
                      onChange={e => setProfileForm({...profileForm, phone: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-primary font-bold flex items-center">
                      <Lock className="mr-1 h-3 w-3" /> Yangi Parol
                    </label>
                    <Input 
                      type="password" 
                      placeholder="O'zgartirish uchun kiriting..." 
                      value={profileForm.password} 
                      onChange={e => setProfileForm({...profileForm, password: e.target.value})} 
                    />
                    <p className="text-[10px] text-muted-foreground">Bo'sh qoldirsangiz parol o'zgarmaydi.</p>
                  </div>
                </div>
                <div className="pt-4">
                  <Button type="submit">O'zgarishlarni Saqlash</Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <Card className="border-primary/10 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Xavfsizlik bo'yicha maslahat</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <p>Parolingizni muntazam ravishda o'zgartirib turish tavsiya etiladi.</p>
              <p>Kamida 8 tadan ortiq belgi, raqam va maxsus belgilardan foydalaning.</p>
              <div className="pt-2">
                <Button variant="outline" className="w-full text-xs" onClick={() => toast.info("Barmoq izini kiritish sahifasi ishlab chiqilmoqda")}>
                  <Fingerprint className="mr-2 h-4 w-4" /> Barmoq izini yangilash
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-3 border-primary/20 bg-card/30 backdrop-blur-sm mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-primary" /> Tashkilot Geofencing Sozlamalari
              </CardTitle>
              <CardDescription>
                Xodimlar davomatdan o'tishi uchun ruxsat etilgan hududni belgilang.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLocationUpdate} className="grid md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Kenglik (Latitude)</label>
                  <Input 
                    type="number" 
                    step="0.000001"
                    value={locationForm.latitude} 
                    onChange={e => setLocationForm({...locationForm, latitude: parseFloat(e.target.value)})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Uzunlik (Longitude)</label>
                  <Input 
                    type="number" 
                    step="0.000001"
                    value={locationForm.longitude} 
                    onChange={e => setLocationForm({...locationForm, longitude: parseFloat(e.target.value)})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Radius (metrda)</label>
                  <Input 
                    type="number" 
                    value={locationForm.radius_meters} 
                    onChange={e => setLocationForm({...locationForm, radius_meters: parseInt(e.target.value)})} 
                  />
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <Button type="submit" disabled={locationLoading}>
                    {locationLoading ? 'Saqlanmoqda...' : 'Lokatsiyani Saqlash'}
                  </Button>
                </div>
              </form>
              <div className="mt-4 p-4 bg-blue-500/10 rounded-lg text-xs text-blue-700 border border-blue-200">
                <strong>Eslatma:</strong> Agar xodim ushbu radiusdan tashqarida bo'lsa, tizim ularga davomatdan o'tishga ruxsat bermaydi. 
                Hozirgi koordinatalar xaritada Tashkent markaziga yaqin belgilanadi.
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add User Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-[90vw] max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border-primary/20 animate-in fade-in zoom-in duration-200">
            <CardHeader className="bg-primary/5">
              <CardTitle>Yangi foydalanuvchi qo'shish</CardTitle>
              <CardDescription>Foydalanuvchi ma'lumotlarini kiriting.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">JSHSHIR (PINFL)</label>
                  <Input required value={addForm.jshshir} onChange={e => setAddForm({ ...addForm, jshshir: e.target.value })} placeholder="14 ta raqam" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">To'liq ism (F.I.SH.)</label>
                  <Input required value={addForm.full_name} onChange={e => setAddForm({ ...addForm, full_name: e.target.value })} placeholder="Alisher Navoiy" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Tug'ilgan sana</label>
                  <Input required type="date" value={addForm.birth_date} onChange={e => setAddForm({ ...addForm, birth_date: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Email</label>
                  <Input required type="email" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} placeholder="mail@example.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Telefon</label>
                  <Input required value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} placeholder="+998901234567" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Rol</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={addForm.role}
                    onChange={e => setAddForm({ ...addForm, role: e.target.value as any })}
                  >
                    <option value="employee">Xodim (Employee)</option>
                    <option value="manager">Menejer (Manager)</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-bold">Parol (Vaqtinchalik)</label>
                  <Input required type="password" value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })} placeholder="******" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Barmoq izi rasmi (Ixtiyoriy)</label>
                  <Input type="file" accept="image/*" onChange={handleFileUpload} />
                  <p className="text-[10px] text-muted-foreground">Barmoq izi skaner qilingan rasmni yuklash (ixtiyoriy).</p>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Bekor qilish</Button>
                  <Button type="submit">Qo'shish</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-[90vw] max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border-primary/20 animate-in fade-in zoom-in duration-200">
            <CardHeader className="bg-primary/5">
              <CardTitle>Ma'lumotlarni tahrirlash</CardTitle>
              <CardDescription>{editingUser?.full_name}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">JSHSHIR (PINFL)</label>
                  <Input required value={editForm.jshshir || ''} onChange={e => setEditForm({ ...editForm, jshshir: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">To'liq ism (F.I.SH.)</label>
                  <Input required value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Email</label>
                  <Input required type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Telefon</label>
                  <Input required value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Rol</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={editForm.role}
                    onChange={e => setEditForm({ ...editForm, role: e.target.value as any })}
                  >
                    <option value="employee">Xodim (Employee)</option>
                    <option value="manager">Menejer (Manager)</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="pt-2 border-t mt-4 border-dashed">
                  <label className="text-sm font-medium text-red-500 flex items-center">
                    <Lock className="mr-1 h-3 w-3" /> Parolni yangilash (Ixtiyoriy)
                  </label>
                  <Input 
                    type="password" 
                    placeholder="Yangi parol..." 
                    value={editForm.password} 
                    onChange={e => setEditForm({ ...editForm, password: e.target.value })} 
                    className="mt-1"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Faqat foydalanuvchi parolini o'zgartirmoqchi bo'lsangiz kiriting.</p>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Bekor qilish</Button>
                  <Button type="submit">Saqlash</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </AppLayout>
  )
}

export default AdminDashboard
