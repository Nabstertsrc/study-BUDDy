import { useState } from 'react'
import { auth } from '../lib/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
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
