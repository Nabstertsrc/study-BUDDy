import { lazy } from 'react';

/**
 * A robust wrapper for React.lazy that catches chunk load errors (e.g. 404s after a new deployment)
 * and forces a full page reload to grab the new chunks.
 */
export const lazyImport = (importFunc) => {
    return lazy(async () => {
        try {
            return await importFunc();
        } catch (error) {
            console.error('Chunk load error detected! Reloading page to get fresh assets...', error);
            // Optional: You could show a quick toast here if you want before reloading
            window.location.reload();
            return Promise.reject(error);
        }
    });
};
