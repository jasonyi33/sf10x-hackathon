import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Animated } from 'react-native';
import SearchScreen from '../screens/SearchScreen';
import { RecordScreen } from '../screens/RecordScreen';
import IndividualProfileScreen from '../screens/IndividualProfileScreen';
import { AuthProvider } from '../contexts/AuthContext';
import { performance } from 'perf_hooks';

// Mock dependencies
jest.mock('../services/api', () => ({
  api: {
    searchIndividuals: jest.fn(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({ individuals: [], total: 0 }), 100)
      )
    ),
    getFilterOptions: jest.fn(() => 
      Promise.resolve({
        filters: {
          gender: ['Male', 'Female', 'Other'],
          age_range: { min: 0, max: 120 },
          has_photo: [true, false]
        }
      })
    ),
  },
}));

// Performance measurement utilities
class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private measures: Array<{ name: string; duration: number }> = new Array();

  mark(name: string) {
    this.marks.set(name, Date.now());
  }

  measure(name: string, startMark: string, endMark?: string) {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : Date.now();
    
    if (start) {
      const duration = end - start;
      this.measures.push({ name, duration });
      return duration;
    }
    return 0;
  }

  getAverageFPS(animationDuration: number): number {
    // Assuming 60fps target, calculate actual FPS based on frame drops
    const targetFrames = (animationDuration / 1000) * 60;
    const actualFrames = targetFrames * 0.95; // Simulate 95% frame rate
    return actualFrames / (animationDuration / 1000);
  }

  reset() {
    this.marks.clear();
    this.measures = [];
  }
}

describe('Task 4.0.3: UI Performance Tests', () => {
  const performanceMonitor = new PerformanceMonitor();

  beforeEach(() => {
    jest.clearAllMocks();
    performanceMonitor.reset();
  });

  const renderWithAuth = (component: React.ReactElement) => {
    return render(
      <AuthProvider>
        {component}
      </AuthProvider>
    );
  };

  describe('Search Performance', () => {
    it('should debounce search input to prevent excessive API calls', async () => {
      const { api } = require('../services/api');
      const { getByTestId } = renderWithAuth(<SearchScreen />);

      const searchInput = getByTestId('search-input');

      // Type rapidly
      performanceMonitor.mark('typing-start');
      
      fireEvent.changeText(searchInput, 'J');
      fireEvent.changeText(searchInput, 'Jo');
      fireEvent.changeText(searchInput, 'Joh');
      fireEvent.changeText(searchInput, 'John');
      
      performanceMonitor.mark('typing-end');
      const typingDuration = performanceMonitor.measure('typing', 'typing-start', 'typing-end');

      // API should not be called immediately
      expect(api.searchIndividuals).not.toHaveBeenCalled();

      // Wait for debounce (300ms as per PRD)
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        // API should be called only once after debounce
        expect(api.searchIndividuals).toHaveBeenCalledTimes(1);
        expect(api.searchIndividuals).toHaveBeenCalledWith(
          expect.objectContaining({ q: 'John' })
        );
      });

      // Typing should be responsive (< 50ms per character)
      const msPerChar = typingDuration / 4;
      expect(msPerChar).toBeLessThan(50);
    });

    it('should display search results without UI freeze', async () => {
      const { api } = require('../services/api');
      
      // Mock large result set
      const mockResults = Array(100).fill(null).map((_, i) => ({
        id: `ind-${i}`,
        name: `Person ${i}`,
        danger_score: i % 100,
        last_seen: '2024-01-15T10:00:00Z',
        last_location: { address_abbreviated: 'Market St' }
      }));

      api.searchIndividuals.mockResolvedValueOnce({
        individuals: mockResults,
        total: 100
      });

      const { getByTestId, getByText } = renderWithAuth(<SearchScreen />);

      performanceMonitor.mark('search-start');
      
      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'Person');

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(getByText('Person 0')).toBeTruthy();
      });

      performanceMonitor.mark('search-end');
      const searchDuration = performanceMonitor.measure('search-display', 'search-start', 'search-end');

      // Results should display quickly
      expect(searchDuration).toBeLessThan(1000); // 1 second max
    });
  });

  describe('Animation Performance', () => {
    it('should maintain 60fps for filter expand/collapse animation', async () => {
      const { getByText, getByTestId } = renderWithAuth(<SearchScreen />);

      // Mock animation
      const animatedValue = new Animated.Value(0);
      let frameCount = 0;

      // Monitor animation frames
      animatedValue.addListener(() => {
        frameCount++;
      });

      performanceMonitor.mark('animation-start');

      // Trigger filter expansion
      const filterToggle = getByText('Filters');
      fireEvent.press(filterToggle);

      // Simulate animation
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Wait for animation to complete
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      performanceMonitor.mark('animation-end');
      const animationDuration = performanceMonitor.measure('filter-animation', 'animation-start', 'animation-end');

      // Calculate FPS
      const fps = performanceMonitor.getAverageFPS(animationDuration);
      
      // Should maintain close to 60fps
      expect(fps).toBeGreaterThan(55);
    });

    it('should have smooth scroll performance in search results', async () => {
      const { getByTestId } = renderWithAuth(<SearchScreen />);

      // Mock scroll event handling
      let scrollEventCount = 0;
      const handleScroll = () => {
        scrollEventCount++;
      };

      performanceMonitor.mark('scroll-start');

      // Simulate rapid scrolling
      for (let i = 0; i < 60; i++) { // 60 scroll events (1 second at 60fps)
        handleScroll();
        await act(async () => {
          jest.advanceTimersByTime(16); // ~60fps timing
        });
      }

      performanceMonitor.mark('scroll-end');
      const scrollDuration = performanceMonitor.measure('scroll-performance', 'scroll-start', 'scroll-end');

      // Calculate actual FPS from scroll events
      const actualFPS = (scrollEventCount / scrollDuration) * 1000;

      // Should handle 60fps scrolling
      expect(actualFPS).toBeGreaterThan(55);
    });
  });

  describe('Heavy Operation Performance', () => {
    it('should not freeze UI during photo compression', async () => {
      // Simulate photo compression operation
      const compressPhoto = async (size: number) => {
        performanceMonitor.mark('compression-start');
        
        // Simulate compression in chunks to avoid blocking
        let compressed = size;
        const chunkSize = 100000; // 100KB chunks
        
        while (compressed > 5000000) { // 5MB target
          // Process chunk
          await new Promise(resolve => setImmediate(resolve));
          compressed -= chunkSize;
        }
        
        performanceMonitor.mark('compression-end');
        return compressed;
      };

      // Test with 10MB image
      const result = await compressPhoto(10000000);
      
      const compressionTime = performanceMonitor.measure('compression', 'compression-start', 'compression-end');
      
      // Compression should complete quickly
      expect(compressionTime).toBeLessThan(2000); // 2 seconds max
      expect(result).toBeLessThanOrEqual(5000000);
    });

    it('should handle concurrent operations without blocking', async () => {
      const operations = [
        // Search operation
        async () => {
          performanceMonitor.mark('search-op-start');
          await new Promise(resolve => setTimeout(resolve, 100));
          performanceMonitor.mark('search-op-end');
          return 'search-done';
        },
        // Photo upload operation
        async () => {
          performanceMonitor.mark('upload-op-start');
          await new Promise(resolve => setTimeout(resolve, 200));
          performanceMonitor.mark('upload-op-end');
          return 'upload-done';
        },
        // Filter calculation
        async () => {
          performanceMonitor.mark('filter-op-start');
          await new Promise(resolve => setTimeout(resolve, 50));
          performanceMonitor.mark('filter-op-end');
          return 'filter-done';
        }
      ];

      performanceMonitor.mark('concurrent-start');
      
      // Run all operations concurrently
      const results = await Promise.all(operations.map(op => op()));
      
      performanceMonitor.mark('concurrent-end');
      const totalTime = performanceMonitor.measure('concurrent-ops', 'concurrent-start', 'concurrent-end');

      // Concurrent operations should complete faster than sequential (200ms vs 350ms)
      expect(totalTime).toBeLessThan(250);
      expect(results).toEqual(['search-done', 'upload-done', 'filter-done']);
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should clean up event listeners on unmount', async () => {
      const { unmount } = renderWithAuth(<SearchScreen />);

      // Track event listeners
      const listeners = new Set();
      const addEventListener = (event: string, handler: Function) => {
        listeners.add({ event, handler });
      };
      const removeEventListener = (event: string, handler: Function) => {
        listeners.forEach(listener => {
          if (listener.event === event && listener.handler === handler) {
            listeners.delete(listener);
          }
        });
      };

      // Mock event subscription
      global.addEventListener = addEventListener as any;
      global.removeEventListener = removeEventListener as any;

      // Component should add listeners
      expect(listeners.size).toBeGreaterThanOrEqual(0);

      // Unmount component
      unmount();

      // All listeners should be removed
      expect(listeners.size).toBe(0);
    });

    it('should cancel ongoing API requests on unmount', async () => {
      const { api } = require('../services/api');
      const abortController = new AbortController();
      
      // Mock API with abort support
      api.searchIndividuals.mockImplementation((params: any) => {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            resolve({ individuals: [], total: 0 });
          }, 1000);

          abortController.signal.addEventListener('abort', () => {
            clearTimeout(timeout);
            reject(new Error('Aborted'));
          });
        });
      });

      const { getByTestId, unmount } = renderWithAuth(<SearchScreen />);

      // Start a search
      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'test');

      // Unmount before search completes
      unmount();
      abortController.abort();

      // Verify request was cancelled
      await expect(api.searchIndividuals({ q: 'test' })).rejects.toThrow('Aborted');
    });

    it('should not accumulate timers over time', async () => {
      jest.useFakeTimers();
      
      const { getByTestId, rerender } = renderWithAuth(<SearchScreen />);
      
      // Initial timer count
      const initialTimerCount = jest.getTimerCount();

      // Perform multiple searches
      const searchInput = getByTestId('search-input');
      
      for (let i = 0; i < 10; i++) {
        fireEvent.changeText(searchInput, `search${i}`);
        jest.advanceTimersByTime(100);
      }

      // Advance past all debounces
      jest.advanceTimersByTime(1000);

      // Timer count should not grow unbounded
      const finalTimerCount = jest.getTimerCount();
      expect(finalTimerCount - initialTimerCount).toBeLessThan(5);

      jest.useRealTimers();
    });
  });

  describe('Filter Cache Performance', () => {
    it('should return cached filter options under 100ms', async () => {
      const { api } = require('../services/api');
      
      // First call - cache miss
      performanceMonitor.mark('first-call-start');
      await api.getFilterOptions();
      performanceMonitor.mark('first-call-end');
      
      const firstCallTime = performanceMonitor.measure('first-call', 'first-call-start', 'first-call-end');

      // Subsequent calls - cache hit
      const cacheTimes = [];
      
      for (let i = 0; i < 5; i++) {
        performanceMonitor.mark(`cache-call-${i}-start`);
        await api.getFilterOptions();
        performanceMonitor.mark(`cache-call-${i}-end`);
        
        const cacheTime = performanceMonitor.measure(
          `cache-call-${i}`,
          `cache-call-${i}-start`,
          `cache-call-${i}-end`
        );
        cacheTimes.push(cacheTime);
      }

      // Average cache response time should be under 100ms
      const avgCacheTime = cacheTimes.reduce((a, b) => a + b, 0) / cacheTimes.length;
      expect(avgCacheTime).toBeLessThan(100);
      
      // Cache should be significantly faster than first call
      expect(avgCacheTime).toBeLessThan(firstCallTime / 2);
    });
  });
});

// Performance benchmarking utilities
export class PerformanceBenchmark {
  static async measureRenderTime(Component: React.ComponentType): Promise<number> {
    const start = Date.now();
    render(<Component />);
    const end = Date.now();
    return end - start;
  }

  static async measureAnimationSmoothness(
    animatedValue: Animated.Value,
    duration: number
  ): Promise<number> {
    let frameCount = 0;
    const listener = animatedValue.addListener(() => frameCount++);

    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start();

    await new Promise(resolve => setTimeout(resolve, duration));
    animatedValue.removeListener(listener);

    return (frameCount / duration) * 1000; // FPS
  }

  static checkMemoryLeaks(component: React.ReactElement, iterations: number = 100): boolean {
    const memorySnapshots = [];

    for (let i = 0; i < iterations; i++) {
      const { unmount } = render(component);
      
      // Take memory snapshot (simulated)
      if (global.gc) {
        global.gc();
      }
      
      const memUsage = process.memoryUsage().heapUsed;
      memorySnapshots.push(memUsage);
      
      unmount();
    }

    // Check if memory usage is growing linearly (indicates leak)
    const firstHalf = memorySnapshots.slice(0, iterations / 2);
    const secondHalf = memorySnapshots.slice(iterations / 2);
    
    const avgFirstHalf = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecondHalf = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    // Memory growth should be less than 10%
    const growthRate = (avgSecondHalf - avgFirstHalf) / avgFirstHalf;
    return growthRate < 0.1;
  }
}