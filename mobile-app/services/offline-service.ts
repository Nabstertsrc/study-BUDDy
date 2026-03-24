import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface CachedAIResponse {
    prompt: string;
    response: string;
    timestamp: number;
    expiresAt: number;
}

class OfflineService {
    private readonly CACHE_KEY = 'study_buddy_ai_cache';
    private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

    /**
     * Cache an AI response for offline access
     */
    async cacheResponse(prompt: string, response: string): Promise<void> {
        try {
            const cache = await this.getCache();
            const timestamp = Date.now();

            cache[prompt] = {
                prompt,
                response,
                timestamp,
                expiresAt: timestamp + this.CACHE_DURATION,
            };

            await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
            console.log('[OfflineService] Cached response');
        } catch (error) {
            console.error('[OfflineService] Cache error:', error);
        }
    }

    /**
     * Get a cached AI response if available and not expired
     */
    async getCachedResponse(prompt: string): Promise<string | null> {
        try {
            const cache = await this.getCache();
            const cached = cache[prompt];

            if (!cached) return null;

            // Check if expired
            if (Date.now() > cached.expiresAt) {
                delete cache[prompt];
                await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
                return null;
            }

            return cached.response;
        } catch (error) {
            console.error('[OfflineService] Get cache error:', error);
            return null;
        }
    }

    private async getCache(): Promise<Record<string, CachedAIResponse>> {
        try {
            const data = await AsyncStorage.getItem(this.CACHE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('[OfflineService] Parse cache error:', error);
            return {};
        }
    }

    async clearAllCache(): Promise<void> {
        try {
            await AsyncStorage.removeItem(this.CACHE_KEY);
            console.log('[OfflineService] All cache cleared');
        } catch (error) {
            console.error('[OfflineService] Clear all error:', error);
        }
    }

    /**
     * Check if device is online
     */
    async isOnline(): Promise<boolean> {
        if (Platform.OS === 'web') {
            return navigator.onLine;
        }
        // In a real app we'd use NetInfo, for now we can try a simple fetch or assume online
        try {
            const response = await fetch('https://google.com', { method: 'HEAD', mode: 'no-cors' });
            return response.ok || response.status === 0;
        } catch {
            return false;
        }
    }
}

export const offlineService = new OfflineService();
