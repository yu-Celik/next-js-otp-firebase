"use client"

import { useState } from "react"
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator,
} from "@/components/ui/input-otp"

// Composant principal
export default function Home() {
    const [code, setCode] = useState("")

    // Fonction pour gérer la soumission du code
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        console.log("Code soumis:", code)
        // Ici vous pourrez ajouter la logique Firebase
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">
                        Vérification du Code
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Veuillez entrer le code à 6 chiffres
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div className="flex justify-center">
                        <InputOTP maxLength={6}>
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
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            aria-label="Vérifier le code"
                        >
                            Vérifier
                        </button>
                    </div>
                </form>
            </div>
        </main>
    )
}
