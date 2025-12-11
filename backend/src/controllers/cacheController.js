import cache from '../utils/cache.js';

/**
 * Clear all cache entries
 * This is useful for debugging and ensuring fresh data
 */
export const clearAllCache = async (req, res) => {
  try {
    cache.clear();
    console.log('Cache cleared successfully');
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = async (req, res) => {
  try {
    const size = cache.size();
    res.json({ 
      message: 'Cache statistics retrieved',
      size: size,
      keys: [...cache.cache.keys()] // Get all cache keys
    });
  } catch (error) {
    console.error('Get cache stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export default {
  clearAllCache,
  getCacheStats
};