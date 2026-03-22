import React, { useEffect, useRef, useContext } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { db } from './db';
import AuthContext from '@/lib/AuthContext';

export default function StudyUsageTracker() {
    const location = useLocation();
    const { id: moduleId } = useParams(); // For routes like /modules/:id
    const auth = useContext(AuthContext);
    const user = auth?.user;
    const userRef = useRef(user);
    const moduleIdRef = useRef(moduleId);
    const startTimeRef = useRef(Date.now());
    const lastPathRef = useRef(location.pathname);

    useEffect(() => {
        userRef.current = user;
        moduleIdRef.current = moduleId;
    }, [user, moduleId]);

    useEffect(() => {
        const handleSessionEnd = async () => {
            const endTime = Date.now();
            const durationMs = endTime - startTimeRef.current;
            const durationMinutes = Math.round(durationMs / 60000);

            if (durationMinutes >= 1) {
                const pathAtStart = lastPathRef.current;
                let targetModuleId = moduleIdRef.current;

                if (!targetModuleId && pathAtStart.includes('/modules/')) {
                    const segments = pathAtStart.split('/');
                    targetModuleId = segments[segments.indexOf('modules') + 1];
                }

                try {
                    await db.table('studySessions').add({
                        date: new Date().toISOString(),
                        duration_minutes: durationMinutes,
                        module_id: targetModuleId || 'general',
                        path: pathAtStart,
                        user_id: userRef.current?.id || 'anonymous'
                    });
                    console.log(`Logged study session: ${durationMinutes} mins on ${pathAtStart}`);
                } catch (err) {
                    console.error('Failed to log study session:', err);
                }
            }
            startTimeRef.current = Date.now();
        };

        if (lastPathRef.current !== location.pathname) {
            handleSessionEnd();
            lastPathRef.current = location.pathname;
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                handleSessionEnd();
            } else {
                startTimeRef.current = Date.now();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleSessionEnd);

        return () => {
            handleSessionEnd();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleSessionEnd);
        };
    }, [location.pathname]);

    return null;
}
