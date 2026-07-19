import { useState } from 'react'
import { auth } from '../lib/firebase'
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import FloatingIcons from '@/components/auth/FloatingIcons'
import logo from '@/assets/logo.png'
import { base44 } from '@/api/base44Client'

export default function Signup() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const navigate = useNavigate()

    const handleSignup = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)

            // Send verification email
            await sendEmailVerification(userCredential.user)

            // Specifically sync this initial profile back to Firestore natively so Windows and Web instances persist it!
            await base44.auth.updateProfile({ email, full_name: fullName })

            toast.success('Account created! Please check your email to verify your account.')
            navigate('/Login')
        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
            <FloatingIcons />
            <div className="z-10 w-full max-w-md flex flex-col items-center">
                <div className="w-24 h-24 mb-6 bg-slate-900/50 backdrop-blur-xl p-3 rounded-3xl shadow-2xl shadow-blue-500/20 border border-white/10 flex items-center justify-center">
                    <img src={logo} alt="Study Buddy Logo" className="w-full h-full object-contain" />
                </div>
                <Card className="w-full shadow-2xl border-white/10 bg-slate-900/60 backdrop-blur-2xl text-slate-100">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl font-black text-white">Create an Account</CardTitle>
                        <CardDescription className="text-slate-400">Start your learning journey with Study Buddy</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSignup} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName" className="text-slate-300">Full Name</Label>
                                <Input
                                    id="fullName"
                                    type="text"
                                    placeholder="John Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-300">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-300">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-slate-950/50 border-white/10 text-white focus-visible:ring-blue-500"
                                />
                            </div>
                            <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all" type="submit" disabled={loading}>
                                {loading ? 'Creating account...' : 'Sign Up'}
                            </Button>
                            <div className="text-center text-sm text-slate-400">
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => navigate('/Login')}
                                    className="text-blue-400 hover:text-blue-300 font-semibold hover:underline"
                                >
                                    Login
                                </button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
