import { useState } from 'react'
import { auth } from '../lib/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import FloatingIcons from '@/components/auth/FloatingIcons'
import logo from '@/assets/logo.png'

export default function Login() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        
        // 1. Show waiting message
        const loadingId = toast.loading('Logging in, please wait...')

        try {
            await signInWithEmailAndPassword(auth, email, password)

            // 2. Show success message
            toast.success('Successfully logged in!', { id: loadingId })
            navigate('/')
        } catch (error) {
            // 3. Show error if they aren't registered
            // Note: Firebase sometimes uses invalid-login-credentials for security reasons
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-login-credentials') {
                toast.error('Account not found. Please register first.', { id: loadingId })
            } else {
                toast.error(error.message, { id: loadingId })
            }
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
                        <CardTitle className="text-2xl font-black text-white">Welcome Back</CardTitle>
                        <CardDescription className="text-slate-400">Enter your details to access your workspace</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
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
                                {loading ? 'Logging in...' : 'Login'}
                            </Button>
                            <div className="text-center text-sm text-slate-400">
                                Don't have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => navigate('/Signup')}
                                    className="text-blue-400 hover:text-blue-300 font-semibold hover:underline"
                                >
                                    Sign up
                                </button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
