import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
                        <div className="bg-rose-500 p-8 flex justify-center">
                            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                <AlertCircle className="w-10 h-10 text-white" />
                            </div>
                        </div>
                        <div className="p-8 text-center space-y-6">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Something went wrong</h2>
                            <p className="text-slate-600 leading-relaxed font-medium">
                                The application encountered an unexpected error. Don't worry, your data is safe.
                            </p>

                            {this.state.error && (
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                                    <p className="text-xs font-mono text-slate-500 break-all">
                                        {this.state.error.toString()}
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={() => window.location.reload()}
                                    className="w-full bg-slate-900 text-white hover:bg-slate-800 h-14 rounded-2xl font-bold flex items-center justify-center gap-2 group"
                                >
                                    <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                                    Restart Application
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => window.location.href = '/'}
                                    className="w-full h-14 rounded-2xl font-bold text-slate-500 hover:text-slate-900 flex items-center justify-center gap-2"
                                >
                                    <Home className="w-5 h-5" />
                                    Return Home
                                </Button>
                            </div>
                        </div>
                        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                Error Intelligence Protocol Active
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
