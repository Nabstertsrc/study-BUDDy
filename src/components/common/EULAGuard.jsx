import React, { useState, useEffect } from 'react';

const EULAGuard = ({ children }) => {
    const [accepted, setAccepted] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const hasAccepted = localStorage.getItem('eula_accepted_v1');
        if (hasAccepted === 'true') {
            setAccepted(true);
        }
        setLoading(false);
    }, []);

    const handleAccept = () => {
        localStorage.setItem('eula_accepted_v1', 'true');
        setAccepted(true);
    };

    if (loading) return null;

    if (!accepted) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: '#0f172a',
                color: '#f1f5f9',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999999,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                padding: '20px'
            }}>
                <div style={{
                    background: '#1e293b',
                    padding: '40px',
                    borderRadius: '24px',
                    maxWidth: '840px',
                    width: '100%',
                    maxHeight: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Background Glow */}
                    <div style={{
                        position: 'absolute',
                        top: '-100px',
                        right: '-100px',
                        width: '300px',
                        height: '300px',
                        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                        zIndex: 0
                    }}></div>

                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                            <div style={{ fontSize: '32px' }}>📖</div>
                            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, color: '#f8fafc', letterSpacing: '-0.5px' }}>
                                License Agreement
                            </h1>
                        </div>

                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            background: 'rgba(15, 23, 42, 0.6)',
                            padding: '24px',
                            borderRadius: '16px',
                            fontSize: '15px',
                            lineHeight: '1.7',
                            color: '#94a3b8',
                            marginBottom: '30px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                        }}>
                            <h2 style={{ color: '#3b82f6', marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Nabster Tsr Study Buddy EULA</h2>
                            <p style={{ marginBottom: '12px' }}>This End-User License Agreement ("EULA") is a legal agreement between you and <b>Nabster Tsr</b>.</p>

                            <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #3b82f6', marginBottom: '20px' }}>
                                <p style={{ margin: 0, color: '#cbd5e1', fontWeight: '500' }}>By clicking "I Accept", you acknowledge that:</p>
                            </div>

                            <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
                                <li style={{ marginBottom: '8px' }}>The software is provided <b>"AS IS"</b> without warranty of any kind.</li>
                                <li style={{ marginBottom: '8px' }}>Academic accuracy is not guaranteed; verify all AI-generated content.</li>
                                <li style={{ marginBottom: '8px' }}>Your study documents are processed locally via sidecars (Python/Go).</li>
                                <li style={{ marginBottom: '8px' }}>Usage data is stored locally in your Application Data folder.</li>
                            </ul>

                            <p style={{ fontSize: '13px', fontStyle: 'italic', color: '#64748b' }}>
                                A full copy of the EULA.md is included in your application folder for your records.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexShrink: 0 }}>
                            <button
                                onClick={handleAccept}
                                style={{
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '16px 32px',
                                    borderRadius: '12px',
                                    fontWeight: '700',
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                    flex: 2,
                                    boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.4)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                I Accept & Continue
                            </button>
                            <button
                                onClick={() => window.close()}
                                style={{
                                    background: 'transparent',
                                    color: '#94a3b8',
                                    border: '1px solid #334155',
                                    padding: '16px 24px',
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    flex: 1,
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return children;
};

export default EULAGuard;
