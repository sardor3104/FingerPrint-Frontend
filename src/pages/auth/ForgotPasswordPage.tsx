import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Mail, ArrowLeft, Loader2, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import axiosInstance from '@/api/axiosInstance'

const forgotPasswordSchema = z.object({
  email: z.string().email('Elektron pochta manzili noto\'g\'ri'),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true)
    try {
      await axiosInstance.post('/auth/forgot-password', data)
      setIsSuccess(true)
      toast.success('Tiklash havolasi yuborildi! Iltimos, elektron pochtangizni tekshiring.')
    } catch (error: any) {
      console.error('Password reset request failed:', error)
      // Mock for development
      if (process.env.NODE_ENV === 'development') {
        setIsSuccess(true)
        toast.success('Reset link sent (Demo Mode)')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.1),transparent)] pointer-events-none"></div>

      <Card className="w-full max-w-md border-primary/20 bg-card/50 backdrop-blur-sm shadow-2xl">
        {!isSuccess ? (
          <>
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <KeyRound className="h-10 w-10 text-primary" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight">Parolni unutdingizmi?</CardTitle>
              <CardDescription>
                Xavotir olmang, biz sizga parolni tiklash bo'yicha ko'rsatmalarni yuboramiz.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      {...register('email')}
                      className="pl-10"
                      placeholder="name@company.com"
                      type="email"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
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
                <Mail className="h-12 w-12 text-green-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Elektron pochtangizni tekshiring</h2>
              <p className="text-sm text-muted-foreground">
                Biz sizning elektron pochta manzilingizga parolni tiklash havolasini yubordik.
              </p>
            </div>
          </CardContent>
        )}
        <CardFooter className="flex justify-center pb-8">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-primary flex items-center transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Tizimga kirishga qaytish
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

export default ForgotPasswordPage
