// utils/cacheService.js
import NodeCache from "node-cache";

// Create a new cache instance with standard TTL of 10 minutes
// and checkperiod of 12 minutes (to delete expired entries)
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
    console.log(`Cache hit for key: ${key}`);
    return cachedData;
  }

  console.log(`Cache miss for key: ${key}`);
  const freshData = await fetchFunction();
  
  // Convert Mongoose documents to plain objects before caching
  const dataToCache = JSON.parse(JSON.stringify(freshData));
  
  cache.set(key, dataToCache, ttl || 600);
  return freshData; // Return the original data (not stringified) to the route handler
};

/**
 * Clear cache for specific key or keys
 * @param {string|string[]} keys - Key or array of keys to clear
 */
export const clearCache = (keys) => {
  if (Array.isArray(keys)) {
    keys.forEach((key) => cache.del(key));
  } else {
    cache.del(keys);
  }
};

export default cache;
