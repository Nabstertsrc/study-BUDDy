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

export default function Login() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            await signInWithEmailAndPassword(auth, email, password)

            toast.success('Welcome back!')
            navigate('/')
        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
            <FloatingIcons />
            <Card className="w-full max-w-md z-10 shadow-xl border-slate-200/60 bg-white/90 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Login to AI Study Buddy</CardTitle>
                    <CardDescription>Enter your credentials to access your workspace</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
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
                            {loading ? 'Logging in...' : 'Login'}
                        </Button>
                        <div className="text-center text-sm text-slate-500">
                            Don't have an account?{' '}
                            <button
                                type="button"
                                onClick={() => navigate('/signup')}
                                className="text-primary hover:underline"
                            >
                                Sign up
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
