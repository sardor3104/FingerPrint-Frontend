import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState, useRef } from 'react'
import { Fingerprint, Upload, CheckCircle2, XCircle, Loader2, Camera, Clock } from 'lucide-react'
import { toast } from 'sonner'
import axiosInstance from '@/api/axiosInstance'

const BiometricVerifyPage = () => {
  const [image, setImage] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)

  const getGeolocation = (): Promise<{lat: number, lng: number}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'))
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(new Error('Geolocation is required for attendance. Please enable it.')),
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }

  const triggerAttendance = async (type: 'check-in' | 'check-out') => {
    setStatus('scanning')
    setGeoError(null)

    try {
      // 1. Get Geolocation
      const coords = await getGeolocation()
      setLocation(coords)

      // 2. Prepare payload (removing data:image/png;base64, prefix if image exists)
      const base64Image = image ? image.split(',')[1] : null
      const payload = {
        image_base64: base64Image,
        latitude: coords.lat,
        longitude: coords.lng
      }

      // 3. API call
      const endpoint = type === 'check-in' ? '/attendance/check-in' : '/attendance/check-out'
      const response = await axiosInstance.post(endpoint, payload)
      
      if (response.data.allowed) {
        setStatus('success')
        toast.success(type === 'check-in' ? 'Check-in Successful!' : 'Check-out Successful!')
      } else {
        setStatus('error')
        toast.error(response.data.reason || 'Verification Failed.')
      }
    } catch (error: any) {
      console.error('Attendance error:', error)
      setStatus('error')
      const msg = error.message || 'An error occurred during verification.'
      setGeoError(msg)
      toast.error(msg)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-8 py-8 px-4">
        <div className="text-center space-y-2">
          <Fingerprint className="h-16 w-16 text-primary mx-auto" />
          <h1 className="text-3xl font-extrabold tracking-tight">Identity Verification</h1>
          <p className="text-muted-foreground">Scan your fingerprint to confirm your identity for access control.</p>
        </div>

        <Card className="border-primary/20 overflow-hidden bg-card/50 backdrop-blur-sm shadow-xl">
          <CardHeader className="text-center border-b pb-6">
            <CardTitle>Fingerprint Scanner</CardTitle>
            <CardDescription>Place your finger on the scanner or upload an image</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="relative group aspect-square max-w-[300px] mx-auto rounded-2xl border-4 border-dashed border-primary/30 flex items-center justify-center transition-all hover:border-primary/60 bg-accent/5">
              {image ? (
                <div className="relative w-full h-full p-4">
                  <img src={image} alt="Fingerprint" className="w-full h-full object-contain rounded-lg" />
                  <div className="absolute inset-x-0 bottom-6 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="secondary" onClick={() => setImage(null)}>Remove</Button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="p-4 bg-primary/10 rounded-full inline-block">
                    <Camera className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="mr-2 h-4 w-4" /> Upload Fingerprint
                    </Button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </div>
                </div>
              )}

              {/* Scanning Pulse Overlay */}
              {status === 'scanning' && (
                <div className="absolute inset-0 z-10 bg-primary/20 flex flex-col items-center justify-center backdrop-blur-[2px]">
                  <div className="relative">
                    <Fingerprint className="h-20 w-20 text-primary animate-pulse" />
                    <div className="absolute inset-x-0 top-0 h-1 bg-primary shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                  </div>
                  <p className="mt-4 font-bold tracking-widest text-primary">SCANNIG...</p>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-col items-center space-y-4">
              {status === 'idle' || status === 'scanning' ? (
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                  <Button 
                    size="lg" 
                    className="flex-1 max-w-[200px] h-16 text-lg font-bold shadow-lg bg-blue-600 hover:bg-blue-700" 
                    disabled={status === 'scanning'}
                    onClick={() => triggerAttendance('check-in')}
                  >
                    {status === 'scanning' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Fingerprint className="mr-2 h-5 w-5" />}
                    Check-in
                  </Button>
                  <Button 
                    size="lg" 
                    className="flex-1 max-w-[200px] h-16 text-lg font-bold shadow-lg bg-purple-600 hover:bg-purple-700" 
                    disabled={status === 'scanning'}
                    onClick={() => triggerAttendance('check-out')}
                  >
                    {status === 'scanning' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Clock className="mr-2 h-5 w-5" />}
                    Check-out
                  </Button>
                </div>
              ) : status === 'success' ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-green-500/20 rounded-full">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                  </div>
                  <p className="text-xl font-bold text-green-500">Access Granted!</p>
                  <Button variant="outline" onClick={() => setStatus('idle')}>Try Again</Button>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4 text-center">
                  <div className="p-4 bg-destructive/20 rounded-full">
                    <XCircle className="h-12 w-12 text-destructive" />
                  </div>
                  <p className="text-xl font-bold text-destructive">Verification Failed!</p>
                  <p className="text-sm text-muted-foreground">The biometric data did not match our records.</p>
                  <Button variant="outline" onClick={() => setStatus('idle')}>Retry Scan</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="p-6 bg-accent/20 rounded-xl border border-primary/10">
          <h3 className="font-semibold text-sm mb-3 flex items-center">
            <ShieldCheck className="h-4 w-4 mr-2 text-primary" /> Security Best Practices
          </h3>
          <ul className="text-xs text-muted-foreground space-y-2">
            <li>• Ensure your finger is clean and dry before scanning.</li>
            <li>• Align your fingertip with the center of the scanning area.</li>
            <li>• If using a photo, ensure it's high resolution and well-lit.</li>
            <li>• Report any suspicious login attempts to your IT administrator.</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  )
}

import { ShieldCheck } from 'lucide-react'

export default BiometricVerifyPage
