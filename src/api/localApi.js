import { db, getStudyStats, ensureDbOpen } from "../lib/db";
import { safeJsonParse } from "../lib/safeJsonParser";
import { supabase } from "../lib/supabase";

const syncToFirestore = async (tableName, action, id, data = null) => {
    try {
        const { auth: firebaseAuth, db: firestoreDB } = await import('../lib/firebase');
        const { doc, setDoc, deleteDoc } = await import('firebase/firestore');

        const user = firebaseAuth.currentUser;
        if (!user) return; // Only sync if user is logged in

        // Save the entity properties into the user's specific collection
        const docRef = doc(firestoreDB, 'users', user.uid, tableName, id.toString());

        if (action === 'delete') {
            await deleteDoc(docRef);
        } else {
            // Filter out undefined values and explicitly include userId for root-level rule compatibility
            const cleanData = { userId: user.uid };
            if (data) Object.entries(data).forEach(([k, v]) => { if (v !== undefined) cleanData[k] = v; });
            await setDoc(docRef, cleanData, { merge: true });
        }
    } catch (e) {
        console.error(`[Firestore Sync] Failed to sync ${tableName} (${action}):`, e);
    }
};

const createEntity = (tableName) => ({
    list: async (orderBy = null, limit = null) => {
        await ensureDbOpen();
        try {
            const results = await db.table(tableName).toArray();
            if (orderBy) {
                const isDesc = orderBy.startsWith('-');
                const field = isDesc ? orderBy.substring(1) : orderBy;
                results.sort((a, b) => {
                    const valA = a[field];
                    const valB = b[field];
                    if (valA < valB) return isDesc ? 1 : -1;
                    if (valA > valB) return isDesc ? -1 : 1;
                    return 0;
                });
            }
            if (limit) return results.slice(0, limit);
            return results;
        } catch (err) {
            console.error(`Error listing ${tableName}:`, err);
            return [];
        }
    },
    filter: async (criteria) => {
        await ensureDbOpen();
        try {
            const all = await db.table(tableName).toArray();
            return all.filter(item =>
                Object.entries(criteria).every(([key, value]) => item[key] === value)
            );
        } catch (err) {
            console.error(`Error filtering ${tableName}:`, err);
            return [];
        }
    },
    create: async (data) => {
        await ensureDbOpen();
        const item = { ...data, created_date: data.created_date || new Date().toISOString() };
        const id = await db.table(tableName).add(item);
        const finalItem = { ...item, id };
        // Sync to Firestore in the background
        syncToFirestore(tableName, 'create', id, finalItem);
        return finalItem;
    },
    update: async (id, data) => {
        await ensureDbOpen();
        await db.table(tableName).update(id, data);
        const finalItem = await db.table(tableName).get(id);
        // Sync to Firestore in the background
        syncToFirestore(tableName, 'update', id, finalItem);
        return finalItem;
    },
    delete: async (id) => {
        await ensureDbOpen();
        const result = await db.table(tableName).delete(id);
        // Sync to Firestore in the background
        syncToFirestore(tableName, 'delete', id);
        return result;
    },
    get: async (id) => {
        await ensureDbOpen();
        return await db.table(tableName).get(id);
    },
});

export const localApi = {
    sync: {
        pullFromFirestore: async () => {
            try {
                const { auth: firebaseAuth, db: firestoreDB } = await import('../lib/firebase');
                const { collection, getDocs } = await import('firebase/firestore');

                const user = firebaseAuth.currentUser;
                // Avoid parallel sync cycles on reload
                if (!user || window['__FS_SYNC_RUNNING']) return;
                window['__FS_SYNC_RUNNING'] = true;

                await ensureDbOpen();
                console.log(`[Firestore Sync] Pulling down data for ${user.uid}...`);

                const tablesToSync = [
                    'modules', 'assignments', 'materials', 'quizzes', 'notes',
                    'studySessions', 'learningActivities', 'skillGaps', 'essays',
                    'learningGoals', 'prescribedBooks', 'transactions'
                ];

                for (const tableName of tablesToSync) {
                    try {
                        const colRef = collection(firestoreDB, 'users', user.uid, tableName);
                        const snap = await getDocs(colRef);
                        if (!snap.empty) {
                            const items = snap.docs.map(doc => {
                                const data = doc.data();
                                const idNum = Number(doc.id);
                                return { ...data, id: isNaN(idNum) ? doc.id : idNum };
                            });
                            await db.table(tableName).bulkPut(items);
                        }
                    } catch (tableErr) {
                        console.error(`[Firestore Sync] Failed to pull table ${tableName}:`, tableErr);
                    }
                }
                console.log(`[Firestore Sync] Pull complete!`);
                window['__FS_SYNC_RUNNING'] = false;
            } catch (err) {
                console.error("[Firestore Sync] Critical failure:", err);
                window['__FS_SYNC_RUNNING'] = false;
            }
        }
    },
    entities: {
        Module: createEntity('modules'),
        Assignment: createEntity('assignments'),
        StudyMaterial: createEntity('materials'),
        Quiz: createEntity('quizzes'),
        StudySession: createEntity('studySessions'),
        Note: createEntity('notes'),
        LearningActivity: createEntity('learningActivities'),
        SkillGap: createEntity('skillGaps'),
        Essay: createEntity('essays'),
        LearningGoal: createEntity('learningGoals'),
        PrescribedBook: createEntity('prescribedBooks'),
        Transaction: createEntity('transactions'),
    },
    wallet: {
        FREE_MONTHLY_CREDITS: 25,

        /**
         * Checks the current month and resets free credits if a new month has started.
         * Works with an additive model: base = purchased credits + free monthly credits.
         */
        checkAndResetMonthlyCredits: async () => {
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const lastReset = localStorage.getItem('last_credit_reset_month');

            // One-time migration: clear stale unlimited-mode values (sentinel was 9999999)
            const staleCheck = parseInt(localStorage.getItem('credit_balance') || '0', 10);
            if (staleCheck > 9000) {
                console.log('[Wallet] Migrating from unlimited mode to real credit economy...');
                localStorage.removeItem('credit_balance');
                localStorage.removeItem('purchased_credit_balance');
                localStorage.removeItem('free_credits_this_month');
                localStorage.removeItem('last_credit_reset_month');
            }

            if (lastReset !== currentMonth) {
                // New month: top up the free credits on top of any purchased balance
                const rawBalance = parseInt(localStorage.getItem('credit_balance') || '0', 10);
                const purchasedBalance = parseInt(localStorage.getItem('purchased_credit_balance') || '0', 10);

                // Free monthly credits are separate — reset them
                localStorage.setItem('free_credits_this_month', String(localApi.wallet.FREE_MONTHLY_CREDITS));
                // Recalculate total
                const newTotal = purchasedBalance + localApi.wallet.FREE_MONTHLY_CREDITS;
                localStorage.setItem('credit_balance', String(newTotal));
                localStorage.setItem('last_credit_reset_month', currentMonth);
                console.log(`[Wallet] Monthly reset: ${localApi.wallet.FREE_MONTHLY_CREDITS} free credits added. New total: ${newTotal}`);
            }
        },

        getBalance: async () => {
            await localApi.wallet.checkAndResetMonthlyCredits();
            let balance = parseInt(localStorage.getItem('credit_balance') || '0', 10);

            // Firestore Sync (Primary Source of Truth) — skip when offline
            if (typeof navigator !== 'undefined' && navigator.onLine) {
                try {
                    const { auth: firebaseAuth, db: firestoreDB } = await import('../lib/firebase');
                    const { doc, getDoc } = await import('firebase/firestore');

                    const user = firebaseAuth.currentUser;
                    if (user) {
                        const userDocRef = doc(firestoreDB, 'users', user.uid);
                        const snap = await getDoc(userDocRef);
                        if (snap.exists()) {
                            const data = snap.data();
                            if (data.credit_balance !== undefined && data.credit_balance !== balance) {
                                console.log(`[Wallet] Syncing local balance (${balance}) with cloud (${data.credit_balance})`);
                                balance = data.credit_balance;
                                localStorage.setItem('credit_balance', String(balance));
                            }
                        }
                    }
                } catch (e) {
                    if (e.code !== 'unavailable' && !e.message?.includes('offline')) {
                        console.warn("[Wallet] Firestore balance sync failed:", e);
                    }
                }
            }

            // Supabase Sync (Web Legacy Fallback)
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('credit_balance')
                        .eq('id', user.id)
                        .single();

                    if (profile && profile.credit_balance > balance) {
                        balance = profile.credit_balance;
                        localStorage.setItem('credit_balance', String(balance));
                    }
                }
            } catch (e) {
                // console.warn("[Wallet] Supabase sync failed:", e);
            }

            return Math.max(0, balance);
        },

        updateRemoteBalance: async (newBalance) => {
            try {
                const { auth: firebaseAuth, db: firestoreDB } = await import('../lib/firebase');
                const { doc, setDoc } = await import('firebase/firestore');

                const user = firebaseAuth.currentUser;
                if (!user) return;

                const userDocRef = doc(firestoreDB, 'users', user.uid);
                await setDoc(userDocRef, { credit_balance: newBalance }, { merge: true });
                console.log(`[Wallet] Remote balance updated to ${newBalance} in Firestore`);
            } catch (e) {
                console.error("[Wallet] Failed to sync balance to Firestore:", e);
            }
        },

        getFreeCreditsRemaining: () => {
            return Math.max(0, parseInt(localStorage.getItem('free_credits_this_month') || '0', 10));
        },

        getPurchasedBalance: () => {
            return Math.max(0, parseInt(localStorage.getItem('purchased_credit_balance') || '0', 10));
        },

        addCredits: async (amount, transactionData) => {
            await localApi.wallet.checkAndResetMonthlyCredits();
            const currentTotal = parseInt(localStorage.getItem('credit_balance') || '0', 10);
            const currentPurchased = parseInt(localStorage.getItem('purchased_credit_balance') || '0', 10);

            const newTotal = currentTotal + amount;
            const newPurchased = currentPurchased + amount;

            localStorage.setItem('credit_balance', String(newTotal));
            localStorage.setItem('purchased_credit_balance', String(newPurchased));

            // Sync to Cloud
            await localApi.wallet.updateRemoteBalance(newTotal);

            await localApi.entities.Transaction.create({
                ...transactionData,
                amount: transactionData.amount || 0,
                credits_added: amount,
                type: 'credit_purchase',
                status: 'completed',
                date: new Date().toISOString()
            });

            console.log(`[Wallet] +${amount} credits purchased. New balance: ${newTotal}`);
            return newTotal;
        },

        spendCredits: async (amount, reason) => {
            await localApi.wallet.checkAndResetMonthlyCredits();
            const currentTotal = parseInt(localStorage.getItem('credit_balance') || '0', 10);
            const freeRemaining = parseInt(localStorage.getItem('free_credits_this_month') || '0', 10);
            const purchasedBalance = parseInt(localStorage.getItem('purchased_credit_balance') || '0', 10);

            if (currentTotal < amount) {
                throw new Error('INSUFFICIENT_CREDITS');
            }

            // Deduct from free credits first, then from purchased
            let freeToDeduct = Math.min(amount, freeRemaining);
            let purchasedToDeduct = amount - freeToDeduct;

            const newFree = freeRemaining - freeToDeduct;
            const newPurchased = Math.max(0, purchasedBalance - purchasedToDeduct);
            const newTotal = currentTotal - amount;

            localStorage.setItem('free_credits_this_month', String(newFree));
            localStorage.setItem('purchased_credit_balance', String(newPurchased));
            localStorage.setItem('credit_balance', String(newTotal));

            // Sync to Cloud
            await localApi.wallet.updateRemoteBalance(newTotal);

            await localApi.entities.Transaction.create({
                amount: 0,
                credits_added: -amount,
                type: 'credit_usage',
                reason: reason,
                status: 'completed',
                date: new Date().toISOString()
            });

            console.log(`[Wallet] -${amount} credits for "${reason}". Remaining: ${newTotal}`);
            return newTotal;
        }
    },
    auth: {
        me: async () => {
            const { auth: firebaseAuth } = await import('../lib/firebase');

            const fbUser = firebaseAuth.currentUser;
            if (fbUser) {
                // Background Sync: Hydrate local IndexedDB from Firestore
                if (navigator.onLine) {
                    setTimeout(() => localApi.sync.pullFromFirestore().catch(console.error), 2000);
                }

                // Only attempt Firestore fetch when online
                if (typeof navigator !== 'undefined' && navigator.onLine) {
                    try {
                        const { db: firestoreDB } = await import('../lib/firebase');
                        const { doc, getDoc, setDoc } = await import('firebase/firestore');
                        const userDocRef = doc(firestoreDB, 'users', fbUser.uid);
                        const snap = await getDoc(userDocRef);
                        if (snap.exists()) {
                            const data = snap.data();
                            localStorage.setItem('user_profile', JSON.stringify({ id: fbUser.uid, ...data }));
                            return { id: fbUser.uid, ...data };
                        } else {
                            const newProfile = { email: fbUser.email, full_name: fbUser.displayName || '' };
                            await setDoc(userDocRef, newProfile);
                            return { id: fbUser.uid, ...newProfile };
                        }
                    } catch (e) {
                        if (e.code !== 'unavailable' && !e.message?.includes('offline')) {
                            console.error("Firestore error in me():", e);
                        }
                    }
                }

                // Offline: return cached profile with Firebase uid
                const saved = localStorage.getItem('user_profile');
                if (saved) {
                    const parsed = safeJsonParse(saved, { fallback: null });
                    if (parsed) return { ...parsed, id: fbUser.uid };
                }
                return { id: fbUser.uid, full_name: fbUser.displayName || '', email: fbUser.email };
            }

            // Fallback to local storage
            const saved = localStorage.getItem('user_profile');
            if (saved) return safeJsonParse(saved, { fallback: null });
            return { id: 'user_123', full_name: 'Study Buddy', email: 'student@studybuddy.ai' };
        },
        updateProfile: async (data) => {
            const { auth: firebaseAuth, db: firestoreDB } = await import('../lib/firebase');
            const { doc, setDoc } = await import('firebase/firestore');

            const current = await localApi.auth.me();
            const updated = { ...current, ...data };

            const fbUser = firebaseAuth.currentUser;
            if (fbUser) {
                try {
                    const userDocRef = doc(firestoreDB, 'users', fbUser.uid);
                    await setDoc(userDocRef, { full_name: updated.full_name, email: updated.email }, { merge: true });
                } catch (e) {
                    console.error("Firestore error in updateProfile:", e);
                }
            }

            localStorage.setItem('user_profile', JSON.stringify(updated));
            return updated;
        },
        logout: () => {
            localStorage.removeItem('user_profile');
            localStorage.removeItem('gemini_key');
            localStorage.removeItem('deepseek_key');

            import('../lib/firebase').then(({ auth: firebaseAuth }) => {
                import('firebase/auth').then(({ signOut }) => {
                    signOut(firebaseAuth).catch(err => console.error(err));
                });
            });

            window.location.reload();
        },
    },
    appLogs: {
        logUserInApp: async (pageName) => {
            try {
                // Simplified logging for breadcrumb style tracking
                await localApi.entities.LearningActivity.create({
                    activity_type: 'page_render',
                    topic: pageName,
                    time_spent_minutes: 0,
                    created_date: new Date().toISOString()
                });
                return true;
            } catch (err) {
                console.error("Failed to log app activity:", err);
                return false;
            }
        },
        logInteraction: async (type, topic, metadata = {}) => {
            try {
                await localApi.entities.LearningActivity.create({
                    activity_type: type, // e.g. 'click', 'search', 'ai_generate'
                    topic: topic,
                    performance_score: metadata.performance || null,
                    time_spent_minutes: metadata.timeSpent || 0,
                    created_date: new Date().toISOString()
                });

                // GLOBAL ADMIN TRACKING
                try {
                    const { auth: firebaseAuth, db: firestoreDB } = await import('../lib/firebase');
                    const { doc, setDoc, increment } = await import('firebase/firestore');
                    const user = firebaseAuth.currentUser;

                    if (user) {
                        const statsRef = doc(firestoreDB, 'admin', 'analytics', 'features', type);
                        await setDoc(statsRef, {
                            count: increment(1),
                            last_used: new Date().toISOString(),
                            topic_featured: topic
                        }, { merge: true });
                    }
                } catch (adminErr) {
                    // Silently fail admin tracking to not block user experience
                }

                return true;
            } catch (err) {
                console.error("Interaction log failed:", err);
                return false;
            }
        },
        getStudyStats: getStudyStats
    },
    integrations: {
        Core: {
            UploadFile: async ({ file }) => {
                const electron = window['electron'];
                if (electron) {
                    const reader = new FileReader();
                    return new Promise((resolve, reject) => {
                        reader.onload = async () => {
                            const buffer = reader.result;
                            const filePath = await electron.saveFile({ name: file.name, content: buffer });
                            // Convert to our custom protocol for renderer access
                            const protocolPath = `study-file://${filePath}`;
                            resolve({ file_url: protocolPath });
                        };
                        reader.onerror = reject;
                        reader.readAsArrayBuffer(file);
                    });
                } else {
                    // Web Fallback: Upload to Firebase Storage
                    try {
                        const { storage, auth } = await import('../lib/firebase');
                        const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');

                        const user = auth.currentUser;
                        const userId = user ? user.uid : 'anonymous_uploads';
                        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
                        const uniqueName = `${Date.now()}_${safeName}`;
                        const storageRef = ref(storage, `uploads/${userId}/${uniqueName}`);

                        const snapshot = await uploadBytes(storageRef, file);
                        const downloadUrl = await getDownloadURL(snapshot.ref);
                        return { file_url: downloadUrl };
                    } catch (firebaseErr) {
                        console.error("Firebase Storage upload failed:", firebaseErr);

                        // Critical fail-safe: Large background base64 strings crash Firestore Sync
                        // and AI Payload HTTP headers. We must force the user to fix their Cloud rules!
                        if (firebaseErr.code === 'storage/unauthorized') {
                            throw new Error("Cloud Storage rules are blocking your upload. Please update your Firebase Storage Rules to allow read/write for authenticated users.");
                        } else {
                            throw new Error(`Cloud storage upload failed: ${firebaseErr.message}`);
                        }
                    }
                }
            },
            InvokeLLM: async ({ prompt, systemPrompt = "", ...options }) => {
                try {
                    await localApi.wallet.spendCredits(1, "AI Generation");
                } catch (e) {
                    throw new Error("You have run out of credits! Please upgrade or top up your balance.");
                }

                const { BackendBridge } = await import('../lib/backend-bridge');
                try {
                    return await BackendBridge.generateText(prompt, systemPrompt, options);
                } catch (bridgeError) {
                    console.warn("[Wallet] Refunding 1 credit due to backend AI failure...");
                    await localApi.wallet.addCredits(1, { amount: 0, currency: 'USD', note: 'Refund for failed AI generation' });
                    throw bridgeError;
                }
            },
            ExtractDataFromUploadedFile: async ({ file_url, json_schema }) => {
                const { BackendBridge } = await import('../lib/backend-bridge');
                // Use the bridge or AI service to extract data
                // For now, we'll use a generic prompt since we don't have a direct Extraction API yet
                const prompt = `Extract structured data from the provided document at ${file_url} matching this JSON schema: ${JSON.stringify(json_schema)}`;
                const result = await BackendBridge.generateText(prompt);
                return safeJsonParse(result, {
                    fallback: { modules: [], assignments: [] },
                    verbose: true
                });
            },
            SearchResources: async (query) => {
                const { BackendBridge } = await import('../lib/backend-bridge');
                return await BackendBridge.searchResources(query);
            }
        },
        AI: {
            analyzeSubmission: async (content, assignmentId) => {
                const { studyBuddyAI } = await import('../lib/ai');
                return await studyBuddyAI.getFeedback(content, assignmentId);
            }
        },
        Organizer: {
            AutoOrganizeUpload: async (file) => {
                try {
                    await localApi.wallet.spendCredits(1, "AI Auto-Organizer");
                } catch (e) {
                    throw new Error("You have run out of credits! Please upgrade or top up your balance to analyze files.");
                }

                let result;
                try {
                    const { extractTextFromPDF } = await import('../lib/pdfProcessor');
                    const fileText = await extractTextFromPDF(file);

                    const { generateWithGemini, studyBuddyAI } = await import('../lib/ai');
                    const prompt = `Analyze this document content and extract its properties.
    Return ONLY valid JSON matching this schema:
    {
      "title": "Document Title",
      "code": "Module code (e.g. INF3708, COS3711) if present",
      "module_codes_found": ["Array of any other module codes found"],
      "description": "3 sentence summary of content",
      "assignments_found": [{ "title": "string", "due_date": "YYYY-MM-DD", "description": "string", "code": "module code" }],
      "prescribed_books": [{ "title": "string", "author": "string", "edition": "string" }]
    }
    DOCUMENT CONTENT: 
    ${fileText.length > 25000 ? fileText.substring(0, 25000) + '...' : fileText}`;

                    const response = await generateWithGemini(prompt, "You are a smart Data Parser. Output RAW JSON strictly matching schema.");
                    const { safeJsonParseObject } = await import('../lib/safeJsonParser');
                    result = { data: safeJsonParseObject(response, { throwOnError: true }) };

                    if (!result?.data) throw new Error("AI failed to extract structured data from this file.");
                } catch (err) {
                    console.warn("[Wallet] Refunding 1 credit due to Auto-Organizer failure...");
                    await localApi.wallet.addCredits(1, { amount: 0, currency: 'USD', note: 'Refund for failed Auto-Organizer' });
                    throw err;
                }

                const data = result.data;
                const normalizeCode = (raw) => {
                    if (!raw) return "UNKNOWN";
                    const match = raw.match(/([a-zA-Z]{3}\d{4})/);
                    return match ? match[0].toUpperCase() : raw.toUpperCase();
                };

                const ensureModule = async (code, title) => {
                    const cleanCode = normalizeCode(code);
                    const existing = await localApi.entities.Module.filter({ code: cleanCode });
                    if (existing.length > 0) return existing[0].id;
                    const mod = await localApi.entities.Module.create({
                        code: cleanCode,
                        title: title || 'New Module',
                        semester: 'Current',
                        progress: 0
                    });
                    return mod.id;
                };

                const modId = await ensureModule(data.code, data.title);

                // Background enrichment: Automate Web and Telegram resource discovery
                const triggerBackgroundDiscovery = async (mId, code, mTitle) => {
                    console.log(`Auto-Discovery: Initializing for ${code}...`);
                    const { toast } = await import('sonner');
                    try {
                        const existing = await localApi.entities.StudyMaterial.list();
                        const hasAuto = existing.some(m => m.module_id === mId && m.tags?.includes('auto-discovered'));
                        if (hasAuto) {
                            console.log(`Auto-Discovery: Already enriched for ${code}. Skipping.`);
                            return;
                        }

                        toast.info(`AI Discovery Engine: Scanning for ${code} materials...`, {
                            description: "Connecting to Telegram and Web repositories...",
                            duration: 3000
                        });

                        // 1. Web Library Enrichment - DISABLED
                        // User requested to remove all links that AI cannot OCR/Process immediately.
                        /*
                        const webRes = await studyBuddyAI.findResources(`${code} study notes past papers`, { isBackground: true });
                        for (const res of webRes.slice(0, 3)) {
                            await localApi.entities.StudyMaterial.create({
                                title: `[Auto-Web] ${res.title}`,
                                module_id: mId,
                                type: "link",
                                file_url: res.url,
                                content: res.description,
                                is_processed: true,
                                tags: ["auto-discovered", "web", code]
                            });
                        }
                        */

                        // 2. Telegram Enrichment - DISABLED
                        // User requested to remove auto-add telegram resources.
                        // const tgRes = await studyBuddyAI.findTelegramResources(`${code}`);

                        toast.success(`Module ${code} organized!`, {
                            description: "Ready for your file uploads.",
                            duration: 3000
                        });
                        console.log(`Auto-Discovery: Successfully enriched ${code}`);
                    } catch (e) {
                        console.error(`Auto-Discovery: Enrichment failed for ${code}:`, e);
                    }
                };

                // Multi-module background process: Loop through all identified codes
                const processAllModulesDiscovery = async () => {
                    // Start with the primary module
                    await triggerBackgroundDiscovery(modId, data.code, data.title);

                    // If multiple modules were found in the document (e.g. a timetable or schedule)
                    if (data.module_codes_found && Array.isArray(data.module_codes_found)) {
                        // Filter out the primary one we already did
                        const dynamicCodes = data.module_codes_found.filter(c => c !== data.code);

                        for (const code of dynamicCodes) {
                            // Deep Search Mode: 15 seconds per module to find specific PDFs
                            await new Promise(r => setTimeout(r, 15000));

                            // Ensure the module exists in DB before enriching
                            const mId = await ensureModule(code, `Module ${code}`);
                            await triggerBackgroundDiscovery(mId, code, `Module ${code}`);
                        }
                    }
                };

                // Fire and forget multi-module process
                processAllModulesDiscovery().catch(console.error);

                // Handle Assignments
                if (data.assignments_found) {
                    for (const item of data.assignments_found) {
                        const mId = await ensureModule(item.code || data.code, data.title);
                        await localApi.entities.Assignment.create({
                            title: item.title,
                            module_id: mId,
                            description: item.description,
                            due_date: item.due_date,
                            status: 'not_started'
                        });
                    }
                }

                // Handle Prescribed Books
                if (data.prescribed_books) {
                    for (const book of data.prescribed_books) {
                        // Find resources for this book automatically
                        let resources = [];
                        try {
                            const { studyBuddyAI } = await import('../lib/ai');
                            resources = await studyBuddyAI.findResources(`Prescribed book: ${book.title} by ${book.author}`, { isBackground: true });
                        } catch (e) {
                            console.warn("Failed to find resources for book:", book.title);
                        }

                        await localApi.entities.PrescribedBook.create({
                            title: book.title,
                            author: book.author,
                            edition: book.edition,
                            module_id: modId,
                            source_document: file.name,
                            resources: resources
                        });
                    }
                }

                // 4. Upload file to Cloud Storage so it's not lost on refresh
                let fileUrl = null;
                try {
                    const uploadResult = await localApi.integrations.Core.UploadFile({ file });
                    fileUrl = uploadResult.file_url;
                } catch (uploadErr) {
                    console.warn("[Auto-Organizer] Cloud Storage upload failed. Material will be local-only.", uploadErr);
                }

                await localApi.entities.StudyMaterial.create({
                    title: data.title || file.name,
                    module_id: modId,
                    type: file.type.includes('pdf') ? 'pdf' : 'image',
                    file_url: fileUrl,
                    content: data.description || 'Imported Document',
                    is_processed: true,
                    tags: ["primary-source"]
                });

                return result;
            }
        }
    }
};
