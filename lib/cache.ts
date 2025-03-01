import { LRUCache } from 'lru-cache';

const cache = new LRUCache({
    max: 500,
    ttl: 1000 * 60 * 5, // 5 minutes
});

export async function getCachedData<T>(
    key: string,
    fetcher: () => Promise<T>
): Promise<T> {
    const cached = cache.get(key);
    if (cached) return cached as T;

    const data = await fetcher();
    // @ts-ignore
    cache.set(key, data);
    return data;
} 