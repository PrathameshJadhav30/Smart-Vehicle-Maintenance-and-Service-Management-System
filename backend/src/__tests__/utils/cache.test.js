import cache from '../../utils/cache.js';

describe('Cache Utility', () => {
  beforeEach(() => {
    // Clear cache before each test
    cache.clear();
  });

  afterEach(() => {
    // Clean up any timers
    cache.clear();
  });

  describe('set and get', () => {
    it('should store and retrieve values correctly', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should overwrite existing keys', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');
      expect(cache.get('key1')).toBe('value2');
    });

    it('should store different types of values', () => {
      cache.set('string', 'hello');
      cache.set('number', 42);
      cache.set('boolean', true);
      cache.set('object', { a: 1, b: 2 });
      cache.set('array', [1, 2, 3]);

      expect(cache.get('string')).toBe('hello');
      expect(cache.get('number')).toBe(42);
      expect(cache.get('boolean')).toBe(true);
      expect(cache.get('object')).toEqual({ a: 1, b: 2 });
      expect(cache.get('array')).toEqual([1, 2, 3]);
    });
  });

  describe('has', () => {
    it('should return true for existing keys', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should remove existing keys', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.has('key1')).toBe(false);
    });

    it('should return false when trying to delete non-existent keys', () => {
      expect(cache.delete('nonexistent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(cache.size()).toBe(3);
      cache.clear();
      expect(cache.size()).toBe(0);
    });
  });

  describe('size', () => {
    it('should return correct cache size', () => {
      expect(cache.size()).toBe(0);

      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);

      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);

      cache.delete('key1');
      expect(cache.size()).toBe(1);

      cache.clear();
      expect(cache.size()).toBe(0);
    });
  });

  describe('TTL (Time To Live)', () => {
    jest.useFakeTimers();

    it('should automatically remove entries after TTL expires', () => {
      cache.set('key1', 'value1', 1000); // 1 second TTL
      
      expect(cache.has('key1')).toBe(true);
      
      jest.advanceTimersByTime(1001); // Advance by 1001ms
      
      expect(cache.has('key1')).toBe(false);
    });

    it('should not expire entries before TTL', () => {
      cache.set('key1', 'value1', 2000); // 2 second TTL
      
      expect(cache.has('key1')).toBe(true);
      
      jest.advanceTimersByTime(1000); // Advance by 1 second
      
      expect(cache.has('key1')).toBe(true);
    });

    it('should clear timer when key is manually deleted', () => {
      cache.set('key1', 'value1', 1000); // 1 second TTL
      
      expect(cache.has('key1')).toBe(true);
      
      cache.delete('key1');
      
      expect(cache.has('key1')).toBe(false);
      
      jest.advanceTimersByTime(1000); // Advance by 1 second
      
      // Should still be false (timer was cleared)
      expect(cache.has('key1')).toBe(false);
    });

    it('should handle zero TTL (no expiration)', () => {
      cache.set('key1', 'value1', 0); // No expiration
      
      expect(cache.has('key1')).toBe(true);
      
      jest.advanceTimersByTime(10000); // Advance by 10 seconds
      
      expect(cache.has('key1')).toBe(true);
    });

    it('should handle negative TTL (no expiration)', () => {
      cache.set('key1', 'value1', -1); // No expiration
      
      expect(cache.has('key1')).toBe(true);
      
      jest.advanceTimersByTime(10000); // Advance by 10 seconds
      
      expect(cache.has('key1')).toBe(true);
    });
  });
});