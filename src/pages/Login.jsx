import { useState } from 'react'
import { auth } from '../lib/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import logo from '@/assets/logo.png'
import { useAuth } from '@/lib/AuthContext'

export default function Login() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const navigate = useNavigate()
    const { loginWithGoogle } = useAuth()

    const handleGoogleLogin = async () => {
        setLoading(true)
        const loadingId = toast.loading('Logging in with Google...')
        
        try {
            const res = await loginWithGoogle()
            if (res.success) {
                toast.success('Successfully logged in!', { id: loadingId })
                navigate('/Dashboard')
            } else {
                toast.error(res.message || 'Google login failed', { id: loadingId })
            }
        } catch (error) {
            toast.error(error.message, { id: loadingId })
        } finally {
            setLoading(false)
        }
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        
        // 1. Show waiting message
        const loadingId = toast.loading('Logging in, please wait...')

        try {
            await signInWithEmailAndPassword(auth, email, password)

            // 2. Show success message
            toast.success('Successfully logged in!', { id: loadingId })
            navigate('/Dashboard')
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
        <div className="min-h-screen flex flex-col bg-slate-50 relative overflow-hidden font-sans">
            <div className="w-full h-16 bg-white border-b border-slate-200 flex items-center px-6 shadow-sm">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    <img src={logo} alt="Study Buddy Logo" className="h-8 w-auto object-contain" />
                    <span className="font-extrabold text-xl tracking-tight text-blue-600">Study Buddy</span>
                </div>
            </div>
            
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-[440px]">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 sm:p-10">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h1>
                            <p className="text-slate-500 text-sm">Log in to your account to continue</p>
                        </div>
                        
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-700 font-semibold text-sm">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-12 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 rounded-lg shadow-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-700 font-semibold text-sm">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-12 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 rounded-lg shadow-sm"
                                />
                            </div>
                            
                            <Button 
                                className="w-full h-12 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-lg transition-colors shadow-sm" 
                                type="submit" 
                                disabled={loading}
                            >
                                {loading ? 'Logging in...' : 'Log In'}
                            </Button>
                        </form>
                        
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-slate-500 font-semibold">Or continue with</span>
                            </div>
                        </div>

                        <Button 
                            type="button"
                            variant="outline"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full h-12 font-bold text-slate-700 border-2 border-slate-200 rounded-lg hover:bg-slate-50"
                        >
                            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                                <path d="M1 1h22v22H1z" fill="none" />
                            </svg>
                            Google
                        </Button>
                        
                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <div className="text-center text-sm text-slate-600">
                                Don't have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => navigate('/Signup')}
                                    className="text-blue-600 font-semibold hover:underline"
                                >
                                    Sign Up
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
