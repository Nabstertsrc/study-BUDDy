import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

const DATABASE_NAME = 'study_buddy_v2.db';

export interface Module {
    id: string;
    code: string;
    title: string;
    credits: number;
    semester: number;
    progress: number;
}

export interface Assignment {
    id: string;
    title: string;
    module_id: string;
    description: string;
    due_date: string;
    status: 'pending' | 'completed' | 'overdue';
    priority: 'low' | 'medium' | 'high';
    grade?: number;
    max_grade?: number;
}

export interface StudySession {
    id: string;
    module_id: string;
    duration_minutes: number;
    date: string;
    topic: string;
}

export interface AIGeneratedContent {
    id: string;
    title: string;
    type: 'quiz' | 'notes' | 'deepdive' | 'essay' | 'summary';
    subject?: string;
    grade?: string;
    content: string; // JSON string
    createdAt: string; // ISO string
    questionCount?: number;
}

class DatabaseService {
    private db: SQLite.SQLiteDatabase | null = null;

    async init() {
        if (Platform.OS === 'web') return;
        if (this.db) return;

        try {
            this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);

            await this.db.execAsync(`
                CREATE TABLE IF NOT EXISTS modules (
                    id TEXT PRIMARY KEY,
                    code TEXT,
                    title TEXT,
                    credits INTEGER,
                    semester INTEGER,
                    progress INTEGER DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS assignments (
                    id TEXT PRIMARY KEY,
                    title TEXT,
                    module_id TEXT,
                    description TEXT,
                    due_date TEXT,
                    status TEXT,
                    priority TEXT,
                    grade REAL,
                    max_grade REAL
                );

                CREATE TABLE IF NOT EXISTS study_sessions (
                    id TEXT PRIMARY KEY,
                    module_id TEXT,
                    duration_minutes INTEGER,
                    date TEXT,
                    topic TEXT
                );

                CREATE TABLE IF NOT EXISTS notifications (
                    id TEXT PRIMARY KEY,
                    type TEXT,
                    title TEXT,
                    message TEXT,
                    read INTEGER DEFAULT 0,
                    createdAt TEXT
                );

                CREATE TABLE IF NOT EXISTS ai_content (
                    id TEXT PRIMARY KEY,
                    title TEXT,
                    type TEXT,
                    subject TEXT,
                    grade TEXT,
                    content TEXT,
                    createdAt TEXT,
                    questionCount INTEGER
                );

                CREATE TABLE IF NOT EXISTS study_materials (
                    id TEXT PRIMARY KEY,
                    title TEXT,
                    content TEXT,
                    module_id TEXT,
                    type TEXT, -- 'pdf' | 'notes' | 'ocr'
                    createdAt TEXT
                );

                CREATE TABLE IF NOT EXISTS wallet (
                    id TEXT PRIMARY KEY,
                    balance INTEGER,
                    lastUpdated TEXT
                );
            `);

            // Initialize wallet if not exists
            await this.db.runAsync('INSERT OR IGNORE INTO wallet (id, balance, lastUpdated) VALUES (?, ?, ?)', ['user_wallet', 40, new Date().toISOString()]);

            console.log('[DatabaseService] Premium Architecture Initialized');
        } catch (error) {
            console.error('[DatabaseService] Init error:', error);
        }
    }

    // Material Methods
    async saveMaterial(m: { id: string, title: string, content: string, module_id?: string, type: string, createdAt: string }) {
        if (Platform.OS === 'web') return;
        if (!this.db) await this.init();
        await this.db!.runAsync(
            'INSERT OR REPLACE INTO study_materials (id, title, content, module_id, type, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
            [m.id, m.title, m.content, m.module_id || null, m.type, m.createdAt]
        );
    }

    async getMaterials(): Promise<any[]> {
        if (Platform.OS === 'web') return [];
        if (!this.db) await this.init();
        return await this.db!.getAllAsync<any>('SELECT * FROM study_materials ORDER BY createdAt DESC');
    }

    async deleteMaterial(id: string) {
        if (Platform.OS === 'web') return;
        if (!this.db) await this.init();
        await this.db!.runAsync('DELETE FROM study_materials WHERE id = ?', [id]);
    }

    // AI Content Methods
    async saveAIContent(content: AIGeneratedContent) {
        if (Platform.OS === 'web') return;
        if (!this.db) await this.init();
        await this.db!.runAsync(
            'INSERT OR REPLACE INTO ai_content (id, title, type, subject, grade, content, createdAt, questionCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [content.id, content.title, content.type, content.subject || null, content.grade || null, content.content, content.createdAt, content.questionCount || null]
        );
    }

    async getAIContent(): Promise<AIGeneratedContent[]> {
        if (Platform.OS === 'web') return [];
        if (!this.db) await this.init();
        return await this.db!.getAllAsync<AIGeneratedContent>('SELECT * FROM ai_content ORDER BY createdAt DESC');
    }

    async deleteAIContent(id: string) {
        if (Platform.OS === 'web') return;
        if (!this.db) await this.init();
        await this.db!.runAsync('DELETE FROM ai_content WHERE id = ?', [id]);
    }

    // Module Methods
    async getModules(): Promise<Module[]> {
        if (Platform.OS === 'web') return [];
        if (!this.db) await this.init();
        return await this.db!.getAllAsync<Module>('SELECT * FROM modules');
    }

    async saveModule(module: Module) {
        if (Platform.OS === 'web') return;
        if (!this.db) await this.init();
        await this.db!.runAsync(
            'INSERT OR REPLACE INTO modules (id, code, title, credits, semester, progress) VALUES (?, ?, ?, ?, ?, ?)',
            [module.id, module.code, module.title, module.credits, module.semester, module.progress]
        );
    }

    // Analytics Methods (matching original Windows app)
    async getSessionStats() {
        if (Platform.OS === 'web') return { totalMinutes: 0, sessionCount: 0 };
        if (!this.db) await this.init();
        const row = await this.db!.getFirstAsync<{ total: number, count: number }>('SELECT SUM(duration_minutes) as total, COUNT(*) as count FROM study_sessions');
        return {
            totalMinutes: row?.total || 0,
            sessionCount: row?.count || 0
        };
    }

    // Wallet Methods
    async getBalance(): Promise<number> {
        if (Platform.OS === 'web') return 40;
        if (!this.db) await this.init();
        const row = await this.db!.getFirstAsync<{ balance: number }>('SELECT balance FROM wallet WHERE id = ?', ['user_wallet']);
        return row?.balance ?? 0;
    }

    async updateBalance(amount: number): Promise<number> {
        if (Platform.OS === 'web') return 40;
        if (!this.db) await this.init();
        await this.db!.runAsync('UPDATE wallet SET balance = balance + ?, lastUpdated = ? WHERE id = ?', [amount, new Date().toISOString(), 'user_wallet']);
        return await this.getBalance();
    }

    async saveAssignment(assignment: Assignment) {
        if (Platform.OS === 'web') return;
        if (!this.db) await this.init();
        await this.db!.runAsync(
            'INSERT OR REPLACE INTO assignments (id, title, module_id, description, due_date, status, priority, grade, max_grade) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [assignment.id, assignment.title, assignment.module_id, assignment.description, assignment.due_date, assignment.status, assignment.priority, assignment.grade || null, assignment.max_grade || null]
        );
    }

    async getAssignments(): Promise<Assignment[]> {
        if (Platform.OS === 'web') return [];
        if (!this.db) await this.init();
        return await this.db!.getAllAsync<Assignment>('SELECT * FROM assignments ORDER BY due_date ASC');
    }

    async saveNotification(n: { id: string, type: string, title: string, message: string, createdAt: string }) {
        if (Platform.OS === 'web') return;
        if (!this.db) await this.init();
        await this.db!.runAsync(
            'INSERT OR REPLACE INTO notifications (id, type, title, message, read, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
            [n.id, n.type, n.title, n.message, 0, n.createdAt]
        );
    }

    async getNotifications(): Promise<any[]> {
        if (Platform.OS === 'web') return [];
        if (!this.db) await this.init();
        return await this.db!.getAllAsync<any>('SELECT * FROM notifications ORDER BY createdAt DESC');
    }

    async markNotificationRead(id: string) {
        if (Platform.OS === 'web') return;
        if (!this.db) await this.init();
        await this.db!.runAsync('UPDATE notifications SET read = 1 WHERE id = ?', [id]);
    }
}

export const databaseService = new DatabaseService();
