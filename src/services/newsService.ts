import axios from 'axios';
import Parser from 'rss-parser';
import { v4 as uuidv4 } from 'uuid';
import { Article } from '../types';
import { news_sources } from './newsSources';

type CustomItem = {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  contentSnippet?: string;
  description?: string;
  'media:content'?: { $: { url: string } };
  enclosure?: { url: string };
  'media:thumbnail'?: { $: { url: string } }[];
};

// Lightweight parser with minimal fields
const parser = new Parser<any, CustomItem>({
  customFields: {
    item: ['content', 'contentSnippet', 'description']
  },
  timeout: 2000 // Parser timeout
});

// Multi-level caching strategy
const CACHE_KEY = 'news_cache_v2';
const CACHE_TIMESTAMP_KEY = 'news_cache_timestamp_v2';
const PRIORITY_CACHE_KEY = 'priority_news_cache';
const SOURCE_SUCCESS_CACHE = 'source_success_rates';
const CACHE_DURATION = 90 * 1000; // 1.5 minutes for faster updates
const PRIORITY_CACHE_DURATION = 30 * 1000; // 30 seconds for priority sources

// Fastest and most reliable proxies first
const OPTIMIZED_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url='
];

// Source performance tracking
interface SourceStats {
  successRate: number;
  avgResponseTime: number;
  lastSuccess: number;
  failures: number;
}

class SourceManager {
  private stats: Map<string, SourceStats> = new Map();
  
  constructor() {
    this.loadStats();
  }
  
  private loadStats() {
    try {
      const saved = localStorage.getItem(SOURCE_SUCCESS_CACHE);
      if (saved) {
        const data = JSON.parse(saved);
        this.stats = new Map(Object.entries(data));
      }
    } catch (error) {
      console.warn('Failed to load source stats');
    }
  }
  
  private saveStats() {
    try {
      const data = Object.fromEntries(this.stats);
      localStorage.setItem(SOURCE_SUCCESS_CACHE, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save source stats');
    }
  }
  
  recordSuccess(sourceName: string, responseTime: number) {
    const current = this.stats.get(sourceName) || {
      successRate: 0,
      avgResponseTime: 5000,
      lastSuccess: 0,
      failures: 0
    };
    
    current.successRate = Math.min(1, current.successRate + 0.1);
    current.avgResponseTime = (current.avgResponseTime + responseTime) / 2;
    current.lastSuccess = Date.now();
    current.failures = Math.max(0, current.failures - 1);
    
    this.stats.set(sourceName, current);
    this.saveStats();
  }
  
  recordFailure(sourceName: string) {
    const current = this.stats.get(sourceName) || {
      successRate: 0.5,
      avgResponseTime: 5000,
      lastSuccess: 0,
      failures: 0
    };
    
    current.successRate = Math.max(0, current.successRate - 0.2);
    current.failures += 1;
    
    this.stats.set(sourceName, current);
    this.saveStats();
  }
  
  getSortedSources() {
    return news_sources.sort((a, b) => {
      const statsA = this.stats.get(a.name) || { successRate: 0.5, avgResponseTime: 5000, lastSuccess: 0, failures: 0 };
      const statsB = this.stats.get(b.name) || { successRate: 0.5, avgResponseTime: 5000, lastSuccess: 0, failures: 0 };
      
      // Prioritize by success rate, then by response time
      const scoreA = statsA.successRate - (statsA.avgResponseTime / 10000) - (statsA.failures * 0.1);
      const scoreB = statsB.successRate - (statsB.avgResponseTime / 10000) - (statsB.failures * 0.1);
      
      return scoreB - scoreA;
    });
  }
  
  shouldSkipSource(sourceName: string): boolean {
    const stats = this.stats.get(sourceName);
    if (!stats) return false;
    
    // Skip if success rate is very low and recent failures
    return stats.successRate < 0.1 && stats.failures > 3 && (Date.now() - stats.lastSuccess) > 300000; // 5 minutes
  }
}

const sourceManager = new SourceManager();

// Optimized XML sanitization (faster regex)
const sanitizeXml = (xml: string): string => {
  return xml.replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-fA-F]+);)/g, '&amp;');
};

// Ultra-fast RSS fetcher with smart proxy selection
const fetchRssFeed = async (sourceUrl: string, sourceName: string): Promise<Article[]> => {
  if (sourceManager.shouldSkipSource(sourceName)) {
    console.log(`⏭️ Skipping ${sourceName} (poor performance)`);
    return [];
  }
  
  const startTime = Date.now();
  
  // Use only the fastest proxy for each source
  const proxy = OPTIMIZED_PROXIES[0]; // Start with fastest
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await axios.get(`${proxy}${encodeURIComponent(sourceUrl)}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml',
        'User-Agent': 'NewsReader/1.0'
      },
      maxContentLength: 500000, // 500KB limit
      timeout: 3000
    });
    
    clearTimeout(timeoutId);
    
    if (!response.data || typeof response.data !== 'string') {
      throw new Error('Invalid response data');
    }
    
    // Quick validation before parsing
    if (!response.data.includes('<rss') && !response.data.includes('<feed')) {
      throw new Error('Not a valid RSS/Atom feed');
    }
    
    const sanitizedXml = sanitizeXml(response.data);
    const feed = await parser.parseString(sanitizedXml);
    
    if (!feed.items?.length) {
      throw new Error('No items in feed');
    }
    
    // Limit articles per source for faster processing
    const limitedItems = feed.items.slice(0, 15);
    
    const articles = limitedItems.map(item => {
      // Simplified image extraction
      let imageUrl = '';
      if (item.enclosure?.url && item.enclosure.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        imageUrl = item.enclosure.url;
      }
      
      return {
        id: uuidv4(),
        title: (item.title || 'Untitled').substring(0, 200), // Limit title length
        link: item.link || '',
        pubDate: item.pubDate || new Date().toISOString(),
        content: (item.contentSnippet || item.content || item.description || '').substring(0, 500), // Limit content
        image: imageUrl,
        source: sourceName
      };
    });
    
    const responseTime = Date.now() - startTime;
    sourceManager.recordSuccess(sourceName, responseTime);
    
    console.log(`✅ ${sourceName}: ${articles.length} articles (${responseTime}ms)`);
    return articles;
    
  } catch (error) {
    sourceManager.recordFailure(sourceName);
    console.warn(`❌ ${sourceName} failed: ${error.message}`);
    return [];
  }
};

// Smart cache management
class CacheManager {
  static get(key: string): any {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
  
  static set(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      // Handle quota exceeded
      this.clearOldCache();
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch {
        console.warn('Failed to cache data');
      }
    }
  }
  
  static clearOldCache(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('cache') && !key.includes('v2')) {
        localStorage.removeItem(key);
      }
    });
  }
  
  static isExpired(timestamp: string, duration: number): boolean {
    return Date.now() - parseInt(timestamp) > duration;
  }
}

// Lightning-fast priority loading
export const fetchPriorityNews = async (): Promise<Article[]> => {
  console.log('⚡ Fetching priority news...');
  
  // Check priority cache first
  const priorityTimestamp = localStorage.getItem('priority_timestamp');
  if (priorityTimestamp && !CacheManager.isExpired(priorityTimestamp, PRIORITY_CACHE_DURATION)) {
    const cached = CacheManager.get(PRIORITY_CACHE_KEY);
    if (cached?.length) {
      console.log(`📦 Using priority cache: ${cached.length} articles`);
      return cached;
    }
  }
  
  // Get top 3 performing sources
  const topSources = sourceManager.getSortedSources().slice(0, 3);
  
  const articles = await Promise.all(
    topSources.map(source => fetchRssFeed(source.url, source.name))
  );
  
  const flattened = articles.flat().sort((a, b) => 
    new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
  
  // Cache priority results
  CacheManager.set(PRIORITY_CACHE_KEY, flattened);
  localStorage.setItem('priority_timestamp', Date.now().toString());
  
  return flattened;
};

// Main optimized fetch function
export const fetchNewsFromAllSources = async (): Promise<Article[]> => {
  console.log('🚀 Starting optimized news fetch...');
  
  // Multi-level cache check
  const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
  if (cachedTimestamp && !CacheManager.isExpired(cachedTimestamp, CACHE_DURATION)) {
    const cached = CacheManager.get(CACHE_KEY);
    if (cached?.length) {
      console.log(`📦 Using main cache: ${cached.length} articles`);
      return cached;
    }
  }
  
  try {
    // Get intelligently sorted sources
    const sortedSources = sourceManager.getSortedSources();
    
    // Staggered loading: Top sources first, then others
    const topTier = sortedSources.slice(0, 5);
    const remainingSources = sortedSources.slice(5);
    
    // Load top tier with minimal delay
    const topPromises = topTier.map(source => 
      fetchRssFeed(source.url, source.name)
    );
    
    const topResults = await Promise.allSettled(topPromises);
    const topArticles = topResults
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => result.value);
    
    // Load remaining sources in background
    const remainingPromises = remainingSources.map(source => 
      fetchRssFeed(source.url, source.name)
    );
    
    const remainingResults = await Promise.allSettled(remainingPromises);
    const remainingArticles = remainingResults
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => result.value);
    
    // Combine and sort
    const allArticles = [...topArticles, ...remainingArticles];
    allArticles.sort((a, b) => 
      new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    );
    
    console.log(`🎉 Fetch complete: ${allArticles.length} articles`);
    
    // Cache results
    CacheManager.set(CACHE_KEY, allArticles);
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    
    return allArticles;
    
  } catch (error) {
    console.error('❌ Error during fetch:', error);
    
    // Return any cached data as fallback
    const fallback = CacheManager.get(CACHE_KEY) || [];
    console.log(`📦 Using fallback cache: ${fallback.length} articles`);
    return fallback;
  }
};

// Super-fast progressive loading with intelligent batching
export const fetchNewsProgressively = async (
  onProgress?: (articles: Article[], isComplete: boolean) => void
): Promise<Article[]> => {
  console.log('⚡ Starting ultra-fast progressive fetch...');
  
  // Try priority cache first
  const priorityArticles = await fetchPriorityNews();
  if (priorityArticles.length) {
    onProgress?.(priorityArticles, false);
  }
  
  // Check main cache
  const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
  if (cachedTimestamp && !CacheManager.isExpired(cachedTimestamp, CACHE_DURATION)) {
    const cached = CacheManager.get(CACHE_KEY);
    if (cached?.length) {
      console.log(`📦 Using full cache: ${cached.length} articles`);
      onProgress?.(cached, true);
      return cached;
    }
  }
  
  // Progressive loading with smart batching
  const sortedSources = sourceManager.getSortedSources();
  let allArticles: Article[] = [...priorityArticles];
  
  // Load in optimized batches
  const batchSize = 4;
  for (let i = 0; i < sortedSources.length; i += batchSize) {
    const batch = sortedSources.slice(i, i + batchSize);
    
    const batchPromises = batch.map(source => 
      fetchRssFeed(source.url, source.name)
    );
    
    const batchResults = await Promise.allSettled(batchPromises);
    const batchArticles = batchResults
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => result.value);
    
    // Add new articles and sort
    allArticles = [...allArticles, ...batchArticles];
    
    // Remove duplicates efficiently
    const seen = new Set();
    allArticles = allArticles.filter(article => {
      const key = `${article.title}-${article.source}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    
    // Sort by date
    allArticles.sort((a, b) => 
      new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    );
    
    // Update progress
    const isComplete = i + batchSize >= sortedSources.length;
    onProgress?.(allArticles, isComplete);
    
    console.log(`Batch ${Math.floor(i / batchSize) + 1}: ${allArticles.length} total articles`);
  }
  
  // Cache final results
  CacheManager.set(CACHE_KEY, allArticles);
  localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  
  return allArticles;
};

export const testSingleSource = async (sourceName: string): Promise<Article[]> => {
  const source = news_sources.find(s => s.name === sourceName);
  if (!source) {
    throw new Error(`Source ${sourceName} not found`);
  }
  return await fetchRssFeed(source.url, source.name);
};