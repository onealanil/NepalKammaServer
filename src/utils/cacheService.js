// utils/cacheService.js
import NodeCache from "node-cache";
import logger from "./logger.js";

const cache = new NodeCache({ stdTTL: 600, checkperiod: 720 });

/**
 * Retrieve cached data or fetch fresh data if not cached
 * @param {string} key - Cache key
 * @param {Function} fetchFunction - Function to fetch data if not cached
 * @param {number} [ttl] - Optional custom TTL in seconds
 * @returns {Promise<any>} - Cached or fresh data
 */
export const getOrSetCache = async (key, fetchFunction, ttl) => {
  const cachedData = cache.get(key);
  if (cachedData) {
    logger.info('Cache hit', { key, requestId: 'cache_service' });
    return cachedData;
  }
  logger.info('Cache miss', { key, requestId: 'cache_service' });
  const freshData = await fetchFunction();

  const dataToCache = JSON.parse(JSON.stringify(freshData));

  cache.set(key, dataToCache, ttl || 600);
  return freshData;
};

/**
 * Clear cache for specific key or keys
 * @param {string|string[]} keys - Key or array of keys to clear
 */
export const clearCache = (keys) => {
  if (Array.isArray(keys)) {
    keys.forEach((key) => {
      cache.del(key);
      logger.info('Cache cleared', { key, requestId: 'cache_service' });
    });
  } else {
    cache.del(keys);
    logger.info('Cache cleared', { key: keys, requestId: 'cache_service' });
  }
};

/**
 * Clear all nearby job caches
 */
export const clearNearbyCache = () => {
  const keys = cache.keys();
  const nearbyKeys = keys.filter(key => key.startsWith('nearby_'));
  nearbyKeys.forEach(key => {
    cache.del(key);
    logger.info('Nearby cache cleared', { key, requestId: 'cache_service' });
  });
  logger.info(`Cleared ${nearbyKeys.length} nearby cache entries`);
};

/**
 * Clear all search-related caches
 */
export const clearSearchCaches = () => {
  const keys = cache.keys();
  const searchKeys = keys.filter(key => key.startsWith('search_'));
  searchKeys.forEach(key => {
    cache.del(key);
    logger.info('Search cache cleared', { key, requestId: 'cache_service' });
  });
  logger.info(`Cleared ${searchKeys.length} search cache entries`);
};

/**
 * Clear all recommendation caches
 */
export const clearRecommendationCaches = () => {
  const keys = cache.keys();
  const recommendationKeys = keys.filter(key => key.startsWith('recommendations_'));
  recommendationKeys.forEach(key => {
    cache.del(key);
    logger.info('Recommendation cache cleared', { key, requestId: 'cache_service' });
  });
  logger.info(`Cleared ${recommendationKeys.length} recommendation cache entries`);
};

/**
 * Clear all caches (nuclear option)
 */
export const clearAllCaches = () => {
  cache.flushAll();
  logger.info('All caches cleared', { requestId: 'cache_service' });
};

/**
 * Clear nearby caches using grid-based pattern to reduce fragmentation
 */
export const clearNearbyCacheGrid = (latitude, longitude) => {
  const gridLat = Math.floor(latitude * 10) / 10;
  const gridLng = Math.floor(longitude * 10) / 10;

  const keys = cache.keys();
  const nearbyKeys = keys.filter(key =>
    key.includes(`nearby_${gridLat}_${gridLng}`)
  );

  nearbyKeys.forEach(key => {
    cache.del(key);
    logger.info('Nearby cache cleared', { key, requestId: 'cache_service' });
  });

  logger.info(`Cleared ${nearbyKeys.length} nearby cache entries in grid ${gridLat},${gridLng}`);
};

/**
 * Clear nearby caches using grid-based pattern to reduce fragmentation
 */
export const clearNearbyGigCacheGrid = (latitude, longitude) => {
  const gridLat = Math.floor(latitude * 10) / 10;
  const gridLng = Math.floor(longitude * 10) / 10;

  const keys = cache.keys();
  const nearbyKeys = keys.filter(key =>
    key.includes(`gigs_nearby_${gridLat}_${gridLng}`)
  );

  nearbyKeys.forEach(key => {
    cache.del(key);
    logger.info('Nearby cache cleared', { key, requestId: 'cache_service' });
  });

  logger.info(`Cleared ${nearbyKeys.length} nearby cache entries in grid ${gridLat},${gridLng}`);
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    ksize: cache.getStats().ksize,
    vsize: cache.getStats().vsize
  };
};

export default cache;