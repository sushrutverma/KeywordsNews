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
});

// Local storage cache keys
const CACHE_KEY = 'news_cache';
const CACHE_TIMESTAMP_KEY = 'news_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to sanitize XML content
const sanitizeXml = (xml: string): string => {
  return xml
    .replace(/&(?![a-zA-Z0-9#]{1,7};)/g, '&amp;')
    .replace(/&amp;amp;/g, '&amp;');
};

// Simple CORS proxy list - keeping the ones that work most reliably
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://proxy.cors.sh/',
];

// Function to fetch RSS feed from a source
const fetchRssFeed = async (sourceUrl: string, sourceName: string): Promise<Article[]> => {
  console.log(`Fetching from ${sourceName}...`);
  
  // Try each CORS proxy
  for (const proxyUrl of CORS_PROXIES) {
    try {
      const response = await axios.get(`${proxyUrl}${encodeURIComponent(sourceUrl)}`, {
        timeout: 8000,
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        }
      });
      
      if (!response.data) {
        continue; // Try next proxy
      }
      
      const sanitizedXml = sanitizeXml(String(response.data));
      const feed = await parser.parseString(sanitizedXml);
      
      if (!feed.items) {
        continue; // Try next proxy
      }
      
      const articles = feed.items.map(item => {
        // Try to find image
        let imageUrl = '';
        if (item['media:content']?.$?.url) {
          imageUrl = item['media:content'].$.url;
        } else if (item.enclosure?.url) {
          imageUrl = item.enclosure.url;
        } else if (item['media:thumbnail']?.[0]?.$?.url) {
          imageUrl = item['media:thumbnail'][0].$.url;
        }
        
        const content = item.content || item.contentSnippet || item.description || '';
        
        return {
          id: uuidv4(),
          title: item.title || 'Untitled',
          link: item.link || '',
          pubDate: item.pubDate || new Date().toISOString(),
          content: content,
          image: imageUrl,
          source: sourceName
        };
      });
      
      console.log(`✅ ${sourceName}: ${articles.length} articles`);
      return articles;
      
    } catch (error) {
      console.warn(`❌ ${sourceName} failed with proxy ${proxyUrl}:`, error);
      continue; // Try next proxy
    }
  }

  console.error(`All proxies failed for ${sourceName}`);
  return [];
};

// Function to fetch news from all sources
export const fetchNewsFromAllSources = async (): Promise<Article[]> => {
  console.log('🚀 Starting news fetch...');
  
  // Check cache first
  const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
  const now = new Date().getTime();
  
  if (cachedTimestamp && (now - parseInt(cachedTimestamp)) < CACHE_DURATION) {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      try {
        const articles = JSON.parse(cachedData);
        console.log(`📦 Using cached data: ${articles.length} articles`);
        return articles;
      } catch (error) {
        console.warn('Cache parse error, fetching fresh data');
      }
    }
  }
  
  // Fetch fresh data
  try {
    // Process sources in smaller batches to avoid overwhelming
    const batchSize = 3;
    const allArticles: Article[] = [];
    
    for (let i = 0; i < news_sources.length; i += batchSize) {
      const batch = news_sources.slice(i, i + batchSize);
      
      const promises = batch.map(source => 
        fetchRssFeed(source.url, source.name).catch(error => {
          console.error(`Batch error for ${source.name}:`, error);
          return []; // Return empty array on error
        })
      );
      
      const results = await Promise.all(promises);
      const batchArticles = results.flat();
      allArticles.push(...batchArticles);
      
      console.log(`Batch ${Math.floor(i / batchSize) + 1} complete: ${batchArticles.length} articles`);
      
      // Small delay between batches
      if (i + batchSize < news_sources.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Sort by date
    allArticles.sort((a, b) => {
      try {
        return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
      } catch {
        return 0;
      }
    });
    
    console.log(`🎉 Fetch complete: ${allArticles.length} total articles`);
    
    // Cache results
    if (allArticles.length > 0) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(allArticles));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
      } catch (error) {
        console.warn('Failed to cache results:', error);
      }
    }
    
    return allArticles;
    
  } catch (error) {
    console.error('❌ Fatal error during fetch:', error);
    
    // Try to return expired cache as fallback
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      try {
        const articles = JSON.parse(cachedData);
        console.log(`📦 Using expired cache as fallback: ${articles.length} articles`);
        return articles;
      } catch {
        console.error('Failed to parse fallback cache');
      }
    }
    
    return [];
  }
};

// Export test function
export const testSingleSource = async (sourceName: string): Promise<Article[]> => {
  const source = news_sources.find(s => s.name === sourceName);
  if (!source) {
    throw new Error(`Source ${sourceName} not found`);
  }
  return await fetchRssFeed(source.url, source.name);
};