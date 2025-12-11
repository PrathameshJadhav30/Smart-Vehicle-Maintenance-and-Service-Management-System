// Simple in-memory cache utility
class Cache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  // Set a value in cache with optional TTL (time to live in milliseconds)
  set(key, value, ttl = 60000) { // Default 1 minute TTL
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Store the value
    this.cache.set(key, value);

    // Set expiration timer
    if (ttl > 0) {
      const timer = setTimeout(() => {
        this.cache.delete(key);
        this.timers.delete(key);
      }, ttl);
      
      this.timers.set(key, timer);
    }
  }

  // Get a value from cache
  get(key) {
    return this.cache.get(key);
  }

  // Check if key exists in cache
  has(key) {
    return this.cache.has(key);
  }

  // Delete a key from cache
  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    return this.cache.delete(key);
  }

  // Clear all cache
  clear() {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.cache.clear();
  }

  // Get cache size
  size() {
    return this.cache.size;
  }
}

// Create and export a singleton instance
const cache = new Cache();
export default cache;