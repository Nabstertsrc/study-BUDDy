import { useState } from 'react'
import { auth } from '../lib/firebase'
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
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
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">Create an Account</h1>
                            <p className="text-slate-500 text-sm">Start your learning journey with Study Buddy</p>
                        </div>
                        
                        <form onSubmit={handleSignup} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="fullName" className="text-slate-700 font-semibold text-sm">Full Name</Label>
                                <Input
                                    id="fullName"
                                    type="text"
                                    placeholder="John Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    className="h-12 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 rounded-lg shadow-sm"
                                />
                            </div>
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
                                    placeholder="Create a password"
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
                                {loading ? 'Creating account...' : 'Sign Up'}
                            </Button>
                        </form>
                        
                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <div className="text-center text-sm text-slate-600">
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => navigate('/Login')}
                                    className="text-blue-600 font-semibold hover:underline"
                                >
                                    Log In
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
