import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Lock, ArrowLeft, Loader2, KeyRound, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import axiosInstance from '@/api/axiosInstance'

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Parollar mos kelmadi",
  path: ["confirmPassword"],
})

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token && process.env.NODE_ENV !== 'development') {
      toast.error('Tiklash tokeni yaroqsiz yoki mavjud emas.')
      return
    }

    setIsLoading(true)
    try {
      await axiosInstance.post('/auth/reset-password', {
        token,
        new_password: data.password
      })
      setIsSuccess(true)
      toast.success('Parol muvaffaqiyatli tiklandi!')
      setTimeout(() => navigate('/login'), 3000)
    } catch (error: any) {
      console.error('Password reset failed:', error)
      // Mock for development
      if (process.env.NODE_ENV === 'development') {
        setIsSuccess(true)
        toast.success('Password reset (Demo Mode)')
        setTimeout(() => navigate('/login'), 3000)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.1),transparent)] pointer-events-none"></div>
      
      <Card className="w-full max-w-md border-primary/20 bg-card/50 backdrop-blur-sm shadow-2xl">
        {!isSuccess ? (
          <>
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <KeyRound className="h-10 w-10 text-primary" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight">Yangi parolni o'rnating</CardTitle>
              <CardDescription>
                Kuchli va xavfsiz parolni tanlang.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      {...register('password')}
                      className="pl-10" 
                      placeholder="Yangi parol" 
                      type="password" 
                      disabled={isLoading}
                    />
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      {...register('confirmPassword')}
                      className="pl-10" 
                      placeholder="Yangi parolni tasdiqlang" 
                      type="password" 
                      disabled={isLoading}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
                </div>
                <Button className="w-full relative overflow-hidden group shadow-lg" type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <span>Parolni tiklash</span>
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </Button>
              </form>
            </CardContent>
          </>
        ) : (
          <CardContent className="pt-10 pb-6 text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Parolni tiklash yakunlandi</h2>
              <p className="text-sm text-muted-foreground">
                Sizning parolingiz muvaffaqiyatli tiklandi. Tizimga kirish sahifasiga yo'naltirilmoqda...
              </p>
            </div>
            <Button className="w-full" variant="outline" asChild>
              <Link to="/login">Hozir tizimga kirish</Link>
            </Button>
          </CardContent>
        )}
        <CardFooter className="flex justify-center pb-8 p-1">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-primary flex items-center transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Tizimga kirishga qaytish
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

export default ResetPasswordPage
