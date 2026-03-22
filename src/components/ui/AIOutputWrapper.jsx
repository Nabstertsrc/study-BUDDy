import React from 'react';
import { Sparkles, Copy, CheckCircle2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

/**
 * Beautiful wrapper for AI and generated content
 * Provides consistent styling with gradient headers, copy button, and premium glassmorphism design
 */
export const AIOutputWrapper = ({ children, title = "AI Generated Content", icon: Icon = Sparkles, showCopy = true, showDownload = false }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        // Get text content from children
        const getTextContent = (element) => {
            if (typeof element === 'string') return element;
            if (!element || !element.props) return '';
            if (element.props.children) {
                if (Array.isArray(element.props.children)) {
                    return element.props.children.map(getTextContent).join('\\n');
                }
                return getTextContent(element.props.children);
            }
            return '';
        };

        const text = getTextContent(children);
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Background gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5" />

            {/* Main container with glassmorphism */}
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl border-2 border-blue-200/60 shadow-2xl shadow-blue-500/20 overflow-hidden">

                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="font-bold text-xl text-white tracking-tight">{title}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                        {showCopy && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCopy}
                                className="text-white hover:bg-white/20 rounded-xl backdrop-blur-sm transition-all active:scale-95"
                            >
                                {copied ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy
                                    </>
                                )}
                            </Button>
                        )}
                        {showDownload && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-white hover:bg-white/20 rounded-xl backdrop-blur-sm"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </Button>
                        )}
                    </div>
                </div>

                {/* Content area with padding */}
                <div className="p-8">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AIOutputWrapper;
