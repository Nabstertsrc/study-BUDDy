import { Platform } from 'react-native';

export const APP_CONFIG = {
    // App Information
    APP_NAME: 'Study Buddy AI',
    APP_VERSION: '1.0.0',

    // API Configuration
    API: {
        // We'll use the same backend or local keys
        BASE_URL: process.env.EXPO_PUBLIC_TOOLKIT_URL || 'https://toolkit.rork.com',
        ENDPOINTS: {
            LLM: '/agent/chat',
            IMAGE_GENERATION: '/images/generate/',
            SPEECH_TO_TEXT: '/stt/transcribe/',
        },
        TIMEOUT: 45000,
        AI_TIMEOUT: 120000,
        MAX_RETRIES: 2,
    },

    // Cache Configuration
    CACHE: {
        STALE_TIME: 5 * 60 * 1000, // 5 minutes
        GC_TIME: 10 * 60 * 1000, // 10 minutes
    },

    // UI Configuration
    UI: {
        ANIMATION_DURATION: 300,
        DEBOUNCE_DELAY: 500,
        PAGINATION_SIZE: 20,
    },

    // Platform-specific settings
    PLATFORM: {
        IS_IOS: Platform.OS === 'ios',
        IS_ANDROID: Platform.OS === 'android',
        IS_WEB: Platform.OS === 'web',
        IS_DEV: __DEV__,
    },

    // Payment Links
    PAYMENTS: {
        BASIC: {
            PAYPAL: 'https://www.paypal.com/ncp/payment/BSLN4YNSY3WH2',
            YOCO: 'https://pay.yoco.com/r/7XPopK',
            CREDITS: 50,
            PRICE: 5,
        },
        PRO: {
            PAYPAL: 'https://www.paypal.com/ncp/payment/Z88FF3R39WB44',
            YOCO: 'https://pay.yoco.com/r/mEq5we',
            CREDITS: 100,
            PRICE: 10,
        },
        MASTER: {
            PAYPAL: 'https://www.paypal.com/ncp/payment/VVUM4GNPHPJTG',
            YOCO: 'https://pay.yoco.com/r/4gzxbB',
            CREDITS: 150,
            PRICE: 15,
        },
    },

    // Error Messages
    ERRORS: {
        NETWORK: 'Network error. Please check your connection and try again.',
        TIMEOUT: 'Request timeout. Please try again.',
        GENERIC: 'Something went wrong. Please try again.',
        AI_GENERATION: 'Failed to generate content. Please try again.',
        INVALID_RESPONSE: 'Received invalid response from server.',
    },
} as const;

export type AppConfig = typeof APP_CONFIG;
