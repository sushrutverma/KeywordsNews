import axios from 'axios';
import Parser from 'rss-parser';
import { v4 as uuidv4 } from 'uuid';
import { Article } from '../types';
import { news_sources } from './newsSources';

// Custom type for RSS Parser
type CustomItem = {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  contentSnippet?: string;
  description?: string;
  'media:content'?: {
    $: {
      url: string;
    };
  };
  enclosure?: {
    url: string;
  };
  'media:thumbnail'?: {
    $: {
      url: string;
    };
  }[];
};

const parser = new Parser<any, CustomItem>({
  customFields: {
    item: [
      ['media:content', 'media:content'],
      ['media:thumbnail', 'media:thumbnail'],
      'enclosure',
      'content',
      'description',
      'contentSnippet',
    ],
  },
  timeout: 15000, // Increase timeout for slower connections
});

// Local storage cache keys
const CACHE_KEY = 'news_cache';
const CACHE_TIMESTAMP_KEY = 'news_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to sanitize XML content
const sanitizeXml = (xml: string): string => {
  if (typeof xml !== 'string') {
    return '';
  }
  
  return xml
    // Replace unescaped & characters that aren't part of an entity
    .replace(/&(?![a-zA-Z0-9#]{1,7};)/g, '&amp;')
    // Fix any double-escaped ampersands
    .replace(/&amp;amp;/g, '&amp;')
    // Remove null bytes that can cause issues on iOS
    .replace(/\0/g, '')
    // Fix malformed XML declarations
    .replace(/<\?xml[^>]*\?>/i, '<?xml version="1.0" encoding="UTF-8"?>');
};

// Updated CORS proxies with better reliability
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  // Remove unreliable proxies
];

// Detect user agent for platform-specific handling
const getUserAgent = (): string => {
  const userAgent = navigator.userAgent;
  
  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';
  } else if (/Macintosh/i.test(userAgent)) {
    return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }
  
  return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
};

// Function to fetch RSS feed from a source
const fetchRssFeed = async (sourceUrl: string, sourceName: string): Promise<Article[]> => {
  let lastError: Error | null = null;
  const userAgent = getUserAgent();

  console.log(`Attempting to fetch from ${sourceName}...`);

  // Try each CORS proxy in sequence
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxyUrl = CORS_PROXIES[i];
    console.log(`Trying proxy ${i + 1}/${CORS_PROXIES.length}: ${proxyUrl}`);
    
    try {
      const response = await axios.get(`${proxyUrl}${encodeURIComponent(sourceUrl)}`, {
        timeout: 15000, // Increased timeout
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
          'User-Agent': userAgent,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        // Add these options for better compatibility
        validateStatus: function (status) {
          return status >= 200 && status < 300;
        },
        responseType: 'text', // Ensure we get text response
        transformResponse: [(data) => data] // Don't let axios transform the response
      });
      
      // Check if we got valid data
      if (!response.data || typeof response.data !== 'string') {
        throw new Error('Invalid response data');
      }
      
      console.log(`Successfully fetched from ${sourceName} using proxy ${i + 1}`);
      
      // Sanitize the XML content before parsing
      const sanitizedXml = sanitizeXml(response.data);
      
      // Additional validation before parsing
      if (!sanitizedXml.includes('<rss') && !sanitizedXml.includes('<feed') && !sanitizedXml.includes('<channel')) {
        throw new Error('Response does not appear to be valid RSS/XML');
      }
      
      const feed = await parser.parseString(sanitizedXml);
      
      if (!feed.items || !Array.isArray(feed.items)) {
        console.warn(`No items found in feed for ${sourceName}`);
        return [];
      }
      
      const articles = feed.items.map(item => {
        // Try to find image in different RSS formats
        let imageUrl = '';
        try {
          if (item['media:content']?.$?.url) {
            imageUrl = item['media:content'].$.url;
          } else if (item.enclosure?.url && item.enclosure.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            imageUrl = item.enclosure.url;
          } else if (item['media:thumbnail']?.[0]?.$?.url) {
            imageUrl = item['media:thumbnail'][0].$.url;
          }
        } catch (imageError) {
          console.warn('Error extracting image:', imageError);
        }
        
        // Get content from different possible fields
        const content = item.content || item.contentSnippet || item.description || '';
        
        // Validate required fields
        const title = item.title || 'Untitled';
        const link = item.link || '';
        const pubDate = item.pubDate || new Date().toISOString();
        
        return {
          id: uuidv4(),
          title: title.trim(),
          link: link.trim(),
          pubDate: pubDate,
          content: content,
          image: imageUrl,
          source: sourceName
        };
      }).filter(article => article.title && article.link); // Filter out invalid articles
      
      console.log(`Processed ${articles.length} articles from ${sourceName}`);
      return articles;
      
    } catch (error) {
      lastError = error as Error;
      console.warn(`Error fetching from ${sourceName} using proxy ${proxyUrl}:`, error);
      
      // If this is the last proxy, don't continue
      if (i === CORS_PROXIES.length - 1) {
        break;
      }
      
      // Add delay between retries to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      continue;
    }
  }

  // If all proxies failed, log the error and return empty array
  console.error(`All proxies failed for ${sourceName}. Last error:`, lastError);
  return [];
};

// Function to test a single source (useful for debugging)
export const testSingleSource = async (sourceName: string): Promise<Article[]> => {
  const source = news_sources.find(s => s.name === sourceName);
  if (!source) {
    console.error(`Source ${sourceName} not found`);
    return [];
  }
  
  return await fetchRssFeed(source.url, source.name);
};

// Function to fetch news from all sources
export const fetchNewsFromAllSources = async (): Promise<Article[]> => {
  console.log('Starting news fetch...');
  
  // Check if we have valid cached data
  const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
  const now = new Date().getTime();
  
  if (cachedTimestamp && (now - parseInt(cachedTimestamp)) < CACHE_DURATION) {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData);
        console.log(`Using cached data with ${parsedData.length} articles`);
        return parsedData;
      } catch (error) {
        console.warn('Error parsing cached data:', error);
        // Clear invalid cache
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      }
    }
  }
  
  // If no valid cache, fetch fresh data
  try {
    console.log(`Fetching from ${news_sources.length} sources...`);
    
    // Limit concurrent requests to avoid overwhelming the browser/proxies
    const batchSize = 3;
    const allArticles: Article[] = [];
    
    for (let i = 0; i < news_sources.length; i += batchSize) {
      const batch = news_sources.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(news_sources.length / batchSize)}`);
      
      const promises = batch.map(source => 
        fetchRssFeed(source.url, source.name)
      );
      
      const results = await Promise.allSettled(promises);
      const batchArticles = results
        .filter((result): result is PromiseFulfilledResult<Article[]> => result.status === 'fulfilled')
        .map(result => result.value)
        .flat();
      
      allArticles.push(...batchArticles);
      
      // Add small delay between batches
      if (i + batchSize < news_sources.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`Fetched ${allArticles.length} total articles`);
    
    // Sort by date (newest first)
    allArticles.sort((a, b) => {
      try {
        return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
      } catch {
        return 0;
      }
    });
    
    // Cache the results
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(allArticles));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
      console.log('Results cached successfully');
    } catch (cacheError) {
      console.warn('Error caching results:', cacheError);
    }
    
    return allArticles;
    
  } catch (error) {
    console.error('Error fetching news:', error);
    
    // Try to return cached data even if it's expired
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData);
        console.log('Using expired cached data as fallback');
        return parsedData;
      } catch {
        console.error('Could not parse fallback cached data');
      }
    }
    
    return [];
  }
};