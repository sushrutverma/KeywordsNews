import axios, { AxiosRequestConfig } from 'axios';
import Parser from 'rss-parser';
import { v4 as uuidv4 } from 'uuid';
import { Article } from '../types';
import { news_sources } from './newsSources';

// Enhanced custom type for RSS Parser with better typing
type CustomItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  description?: string;
  'content:encoded'?: string;
  guid?: string;
  author?: string;
  creator?: string;
  'dc:creator'?: string;
  categories?: string[];
  'media:content'?: {
    $: {
      url: string;
      type?: string;
      width?: string;
      height?: string;
    };
  } | {
    $: {
      url: string;
      type?: string;
      width?: string;
      height?: string;
    };
  }[];
  enclosure?: {
    url: string;
    type?: string;
    length?: string;
  };
  'media:thumbnail'?: {
    $: {
      url: string;
      width?: string;
      height?: string;
    };
  }[];
  'itunes:image'?: {
    $: {
      href: string;
    };
  };
};

// Enhanced RSS parser with more custom fields
const parser = new Parser<any, CustomItem>({
  customFields: {
    item: [
      ['media:content', 'media:content'],
      ['media:thumbnail', 'media:thumbnail'],
      ['itunes:image', 'itunes:image'],
      ['content:encoded', 'content:encoded'],
      ['dc:creator', 'dc:creator'],
      'enclosure',
      'content',
      'description',
      'contentSnippet',
      'guid',
      'author',
      'creator',
      'categories',
    ],
  },
  timeout: 15000, // 15 second timeout for parsing
});

// Configuration constants
const CONFIG = {
  CACHE_KEY: 'news_cache',
  CACHE_TIMESTAMP_KEY: 'news_cache_timestamp',
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  REQUEST_TIMEOUT: 12000, // 12 seconds
  MAX_RETRIES: 2,
  RETRY_DELAY: 1000, // 1 second
  MAX_ARTICLES_PER_SOURCE: 50, // Limit articles per source
  CONCURRENT_REQUESTS: 3, // Limit concurrent requests
} as const;

// Enhanced CORS proxies with backup options
const CORS_PROXIES = [
  { url: 'https://api.allorigins.win/raw?url=', name: 'AllOrigins' },
  { url: 'https://corsproxy.io/?', name: 'CorsProxy' },
  { url: 'https://api.codetabs.com/v1/proxy?quest=', name: 'CodeTabs' },
  { url: 'https://cors-anywhere.herokuapp.com/', name: 'CorsAnywhere' },
] as const;

// Enhanced error types
class NewsError extends Error {
  constructor(
    message: string,
    public readonly source?: string,
    public readonly proxy?: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'NewsError';
  }
}

// Utility functions
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const sanitizeXml = (xml: string): string => {
  if (typeof xml !== 'string') return '';
  
  return xml
    // Replace unescaped & characters that aren't part of an entity
    .replace(/&(?![a-zA-Z0-9#]{1,7};)/g, '&amp;')
    // Fix any double-escaped ampersands
    .replace(/&amp;amp;/g, '&amp;')
    // Remove null characters that can break XML parsing
    .replace(/\0/g, '')
    // Fix malformed CDATA sections
    .replace(/\]\]>/g, ']]&gt;')
    // Remove or escape other problematic characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
};

const extractImageUrl = (item: CustomItem): string => {
  // Priority order for image extraction
  const imageSources = [
    // Media content (most common)
    () => {
      const mediaContent = item['media:content'];
      if (Array.isArray(mediaContent)) {
        return mediaContent[0]?.$?.url;
      }
      return mediaContent?.$?.url;
    },
    // iTunes image
    () => item['itunes:image']?.$?.href,
    // Enclosure (often used for images)
    () => {
      const enclosure = item.enclosure;
      if (enclosure?.type?.startsWith('image/')) {
        return enclosure.url;
      }
      return undefined;
    },
    // Media thumbnail
    () => item['media:thumbnail']?.[0]?.$?.url,
    // Extract from content/description (basic regex)
    () => {
      const content = item.content || item.description || item['content:encoded'] || '';
      const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
      return imgMatch?.[1];
    }
  ];

  for (const getImageUrl of imageSources) {
    try {
      const url = getImageUrl();
      if (url && isValidUrl(url)) {
        return url;
      }
    } catch (error) {
      // Continue to next source on error
      continue;
    }
  }

  return '';
};

const extractContent = (item: CustomItem): string => {
  // Priority order for content extraction
  const contentSources = [
    item['content:encoded'],
    item.content,
    item.description,
    item.contentSnippet,
  ];

  for (const content of contentSources) {
    if (content && content.trim()) {
      return content.trim();
    }
  }

  return '';
};

const extractAuthor = (item: CustomItem): string => {
  return item.author || item.creator || item['dc:creator'] || '';
};

const normalizeDate = (dateString?: string): string => {
  if (!dateString) return new Date().toISOString();
  
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  } catch {
    return new Date().toISOString();
  }
};

// Enhanced fetch function with retry logic
const fetchWithRetry = async (
  url: string,
  config: AxiosRequestConfig,
  maxRetries: number = CONFIG.MAX_RETRIES
): Promise<string> => {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await sleep(CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1)); // Exponential backoff
      }

      const response = await axios.get(url, config);
      
      if (typeof response.data !== 'string') {
        throw new Error('Invalid response format: expected string');
      }

      return response.data;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Don't retry on certain errors
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw error;
      }
    }
  }

  throw lastError!;
};

// Enhanced RSS feed fetching function
const fetchRssFeed = async (sourceUrl: string, sourceName: string): Promise<Article[]> => {
  if (!isValidUrl(sourceUrl)) {
    throw new NewsError(`Invalid URL for source: ${sourceName}`, sourceName);
  }

  let articles: Article[] = [];
  let lastError: Error | null = null;

  // Try each CORS proxy
  for (const proxy of CORS_PROXIES) {
    try {
      const proxiedUrl = `${proxy.url}${encodeURIComponent(sourceUrl)}`;
      
      const requestConfig: AxiosRequestConfig = {
        timeout: CONFIG.REQUEST_TIMEOUT,
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)',
          'Cache-Control': 'no-cache',
        },
        validateStatus: (status) => status >= 200 && status < 300,
      };

      const xmlData = await fetchWithRetry(proxiedUrl, requestConfig);
      
      if (!xmlData || xmlData.trim().length === 0) {
        throw new Error('Empty response received');
      }

      const sanitizedXml = sanitizeXml(xmlData);
      const feed = await parser.parseString(sanitizedXml);
      
      if (!feed.items || feed.items.length === 0) {
        throw new Error('No items found in RSS feed');
      }

      articles = feed.items
        .slice(0, CONFIG.MAX_ARTICLES_PER_SOURCE) // Limit articles per source
        .map((item): Article => {
          const id = item.guid || item.link || uuidv4();
          
          return {
            id: typeof id === 'string' ? id : uuidv4(),
            title: item.title?.trim() || 'Untitled',
            link: item.link?.trim() || '',
            pubDate: normalizeDate(item.pubDate),
            content: extractContent(item),
            image: extractImageUrl(item),
            source: sourceName,
            author: extractAuthor(item),
            categories: item.categories || [],
          };
        })
        .filter(article => article.title !== 'Untitled' && article.link); // Filter out invalid articles

      console.log(`✅ Successfully fetched ${articles.length} articles from ${sourceName} via ${proxy.name}`);
      return articles;

    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ Failed to fetch from ${sourceName} via ${proxy.name}:`, error instanceof Error ? error.message : error);
      continue;
    }
  }

  // All proxies failed
  throw new NewsError(
    `All proxies failed for ${sourceName}`,
    sourceName,
    undefined,
    lastError || undefined
  );
};

// Enhanced cache management
class CacheManager {
  static get<T>(key: string): T | null {
    try {
      if (typeof localStorage === 'undefined') return null;
      
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
    }
  }

  static set<T>(key: string, value: T): boolean {
    try {
      if (typeof localStorage === 'undefined') return false;
      
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('Cache write error:', error);
      return false;
    }
  }

  static isValid(timestampKey: string, duration: number): boolean {
    const timestamp = this.get<string>(timestampKey);
    if (!timestamp) return false;
    
    const now = Date.now();
    const cacheTime = parseInt(timestamp, 10);
    
    return !isNaN(cacheTime) && (now - cacheTime) < duration;
  }

  static clear(keys: string[]): void {
    if (typeof localStorage === 'undefined') return;
    
    keys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to clear cache key ${key}:`, error);
      }
    });
  }
}

// Enhanced rate limiting for concurrent requests
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;

  constructor(private maxConcurrent: number) {}

  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const task = this.queue.shift()!;
    
    try {
      await task();
    } finally {
      this.running--;
      this.process(); // Process next task
    }
  }
}

// Main function to fetch news from all sources
export const fetchNewsFromAllSources = async (): Promise<Article[]> => {
  console.log('🔄 Starting news fetch process...');
  
  // Check cache first
  if (CacheManager.isValid(CONFIG.CACHE_TIMESTAMP_KEY, CONFIG.CACHE_DURATION)) {
    const cachedData = CacheManager.get<Article[]>(CONFIG.CACHE_KEY);
    if (cachedData && cachedData.length > 0) {
      console.log(`✅ Using cached data (${cachedData.length} articles)`);
      return cachedData;
    }
  }

  // Fetch fresh data
  const rateLimiter = new RateLimiter(CONFIG.CONCURRENT_REQUESTS);
  const results: Array<{ status: 'fulfilled' | 'rejected'; value?: Article[]; reason?: Error }> = [];

  try {
    // Create rate-limited fetch tasks
    const fetchTasks = news_sources.map(source => 
      rateLimiter.add(() => fetchRssFeed(source.url, source.name))
    );

    // Execute all tasks with proper error handling
    const settledResults = await Promise.allSettled(fetchTasks);
    
    // Process results
    const articles: Article[] = [];
    const errors: string[] = [];

    settledResults.forEach((result, index) => {
      const sourceName = news_sources[index].name;
      
      if (result.status === 'fulfilled') {
        articles.push(...result.value);
      } else {
        const error = result.reason;
        const errorMessage = error instanceof NewsError 
          ? error.message 
          : `Unknown error: ${error instanceof Error ? error.message : String(error)}`;
        
        errors.push(`${sourceName}: ${errorMessage}`);
        console.error(`❌ Failed to fetch from ${sourceName}:`, error);
      }
    });

    if (errors.length > 0) {
      console.warn(`⚠️ ${errors.length} sources failed:`, errors);
    }

    if (articles.length === 0) {
      console.warn('⚠️ No articles fetched from any source');
      
      // Try to return stale cached data as fallback
      const staleData = CacheManager.get<Article[]>(CONFIG.CACHE_KEY);
      if (staleData && staleData.length > 0) {
        console.log('📰 Using stale cached data as fallback');
        return staleData;
      }
      
      return [];
    }

    // Remove duplicates based on title and link
    const uniqueArticles = articles.filter((article, index, arr) => 
      arr.findIndex(a => 
        a.title === article.title && a.link === article.link
      ) === index
    );

    // Sort by publication date (newest first)
    uniqueArticles.sort((a, b) => 
      new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    );

    // Cache the results
    const now = Date.now();
    CacheManager.set(CONFIG.CACHE_KEY, uniqueArticles);
    CacheManager.set(CONFIG.CACHE_TIMESTAMP_KEY, now.toString());

    console.log(`✅ Successfully fetched ${uniqueArticles.length} unique articles from ${news_sources.length - errors.length} sources`);
    return uniqueArticles;

  } catch (error) {
    console.error('💥 Critical error in fetchNewsFromAllSources:', error);
    
    // Last resort: try to return any cached data
    const fallbackData = CacheManager.get<Article[]>(CONFIG.CACHE_KEY);
    if (fallbackData && fallbackData.length > 0) {
      console.log('📰 Using fallback cached data due to critical error');
      return fallbackData;
    }

    throw new NewsError(
      'Failed to fetch news and no cached data available',
      undefined,
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
};

// Utility function to clear cache manually
export const clearNewsCache = (): void => {
  CacheManager.clear([CONFIG.CACHE_KEY, CONFIG.CACHE_TIMESTAMP_KEY]);
  console.log('🗑️ News cache cleared');
};

// Utility function to get cache info
export const getCacheInfo = (): { hasCache: boolean; age: number; count: number } => {
  const cachedData = CacheManager.get<Article[]>(CONFIG.CACHE_KEY);
  const timestamp = CacheManager.get<string>(CONFIG.CACHE_TIMESTAMP_KEY);
  
  return {
    hasCache: Boolean(cachedData),
    age: timestamp ? Date.now() - parseInt(timestamp, 10) : 0,
    count: cachedData?.length || 0,
  };
};