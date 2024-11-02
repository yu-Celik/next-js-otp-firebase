"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/firebase"
import {
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithCredential,
  ApplicationVerifier,
  ConfirmationResult,
  signInWithPhoneNumber
} from "firebase/auth"
import { FirebaseError } from "firebase/app"
import { Loader, PhoneIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import {
  InputOTP,
  InputOTPSeparator,
  InputOTPGroup,
  InputOTPSlot
} from "@/components/ui/input-otp"
import { useToast } from "@/hooks/use-toast"


export default function Home() {
  const router = useRouter()
  const { toast } = useToast()

  const [phoneNumber, setPhoneNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [isPending, startTransition] = useTransition()
  const [resendCountDown, setResendCountDown] = useState(0)
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<ApplicationVerifier | null>(null)
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)

  const handleFirebaseError = useCallback(async (error: FirebaseError) => {
    const errorMessages: Record<string, string> = {
      'auth/invalid-phone-number': "Numéro de téléphone invalide",
      'auth/missing-phone-number': "Numéro de téléphone manquant",
      'auth/quota-exceeded': "Trop de requêtes, réessayer plus tard",
      'auth/too-many-requests': "Trop de requêtes, réessayer plus tard",
      'auth/too-many-attempts': "Trop de requêtes, réessayer plus tard",
      'auth/invalid-verification-code': "Code incorrect",
      'auth/code-expired': "Code expiré"
    }

    const message = errorMessages[error.code] || "Une erreur est survenue"
    toast({
      variant: "destructive",
      title: "Erreur",
      description: message,
    })
  }, [toast])

  const formatPhoneNumber = (number: string) => {
    const cleaned = number.replace(/[^\d+]/g, '')
    if (cleaned.startsWith('0')) {
      return '+33' + cleaned.substring(1)
    }
    return cleaned
  }

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const formattedPhone = formatPhoneNumber(phoneNumber)
    setResendCountDown(60)
    startTransition(async () => {
      if (!recaptchaVerifier) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Recaptcha non initialisé"
        })
        return
      }
      try {
        const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier)
        setConfirmationResult(confirmationResult)
        toast({
          title: "Succès",
          description: `Code envoyé à ${formattedPhone}`,
        })
      } catch (error) {
        setResendCountDown(0)
        if (error instanceof FirebaseError) {
          handleFirebaseError(error)
        }
      }
    })
  }

  const verifyOtp = useCallback(async () => {
    if (otp.length !== 6) return

    startTransition(async () => {
      if (!confirmationResult) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Session expirée, veuillez recommencer"
        })
        return
      }
      try {
        const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, otp)
        await signInWithCredential(auth, credential)
        toast({
          title: "Succès",
          description: "Connexion réussie"
        })
        router.push("/dashboard")
      } catch (error) {
        if (error instanceof FirebaseError) {
          handleFirebaseError(error)
        }
      }
    })
  }, [confirmationResult, handleFirebaseError, otp, router, toast])

  useEffect(() => {
    try {
      const recaptcha = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {
          console.log('reCAPTCHA résolu');
          toast({
            title: "Succès",
            description: "Vérification reCAPTCHA réussie"
          })
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expiré');
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "reCAPTCHA expiré, veuillez réessayer"
          })
        },
      })
      setRecaptchaVerifier(recaptcha)
      return () => recaptcha.clear()
    } catch (error) {
      console.error("Erreur d'initialisation reCAPTCHA:", error)
    }
  }, [toast])

  useEffect(() => {
    if (otp.length === 6) {
      verifyOtp()
    }
  }, [otp, verifyOtp])

  useEffect(() => {
    const timer = resendCountDown > 0 &&
      setInterval(() => setResendCountDown(prev => prev - 1), 1000)
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [resendCountDown])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Authentification
            </h1>
            <p className="text-muted-foreground">
              Entrez votre numéro de téléphone pour recevoir un code
            </p>
          </div>
        </CardHeader>

        <form onSubmit={requestOtp}>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="phone"
                    type="text"
                    placeholder="+33 6 12 34 56 78"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10"
                    required
                    aria-label="Numéro de téléphone"
                  />
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={!phoneNumber || isPending || resendCountDown > 0}
            >
              {isPending ? (
                <div className="flex items-center space-x-2">
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Envoi en cours...</span>
                </div>
              ) : resendCountDown > 0 ? (
                `Renvoyer le code dans ${resendCountDown} secondes`
              ) : (
                "Envoyer le code"
              )}
            </Button>
            {confirmationResult && (
              <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)} containerClassName="justify-center">
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            )}
          </CardFooter>
        </form>


        <CardFooter className="text-center text-sm text-muted-foreground">
          <p className="w-full">
            En continuant, vous acceptez de recevoir un SMS avec le code de vérification
          </p>
        </CardFooter>
      </Card>
      <div id="recaptcha-container" className="invisible"></div>
    </main>
  )
}
