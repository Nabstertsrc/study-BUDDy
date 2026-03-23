import { useState } from 'react'
import { auth } from '../lib/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import FloatingIcons from '@/components/auth/FloatingIcons'
import logo from '@/assets/logo.png'

export default function Signup() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const navigate = useNavigate()

    const handleSignup = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            await createUserWithEmailAndPassword(auth, email, password)

            toast.success('Account created! You can now login.')
            navigate('/Login')
        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
            <FloatingIcons />
            <div className="z-10 w-full max-w-md flex flex-col items-center">
                <div className="w-24 h-24 mb-6 bg-white p-3 rounded-3xl shadow-xl shadow-blue-500/10 border border-slate-100 flex items-center justify-center">
                    <img src={logo} alt="Study Buddy Logo" className="w-full h-full object-contain" />
                </div>
                <Card className="w-full shadow-2xl border-slate-200/60 bg-white/95 backdrop-blur-xl">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl font-black">Create an Account</CardTitle>
                        <CardDescription>Start your learning journey with Study Buddy</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSignup} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <Button className="w-full" type="submit" disabled={loading}>
                                {loading ? 'Creating account...' : 'Sign Up'}
                            </Button>
                            <div className="text-center text-sm text-slate-500">
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => navigate('/Login')}
                                    className="text-primary hover:underline"
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
