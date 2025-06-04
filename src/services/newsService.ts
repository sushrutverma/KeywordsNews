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
    // Replace unescaped & characters that aren't part of an entity
    .replace(/&(?![a-zA-Z0-9#]{1,7};)/g, '&amp;')
    // Fix any double-escaped ampersands
    .replace(/&amp;amp;/g, '&amp;');
};

// List of CORS proxies to try in order
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://cors-anywhere.herokuapp.com/',
];

// Function to fetch RSS feed from a source
const fetchRssFeed = async (sourceUrl: string, sourceName: string): Promise<Article[]> => {
  let lastError: Error | null = null;

  // Try each CORS proxy in sequence
  for (const proxyUrl of CORS_PROXIES) {
    try {
      const response = await axios.get(`${proxyUrl}${encodeURIComponent(sourceUrl)}`, {
        timeout: 10000, // 10 second timeout
        retry: 2, // Retry failed requests up to 2 times
        retryDelay: 1000, // Wait 1 second between retries
      });
      
      // Sanitize the XML content before parsing
      const sanitizedXml = sanitizeXml(response.data);
      const feed = await parser.parseString(sanitizedXml);
      
      return feed.items.map(item => {
        // Try to find image in different RSS formats
        let imageUrl = '';
        if (item['media:content']?.$?.url) {
          imageUrl = item['media:content'].$.url;
        } else if (item.enclosure?.url) {
          imageUrl = item.enclosure.url;
        } else if (item['media:thumbnail']?.[0]?.$?.url) {
          imageUrl = item['media:thumbnail'][0].$.url;
        }
        
        // Get content from different possible fields
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
    } catch (error) {
      lastError = error as Error;
      console.warn(`Error fetching from ${sourceName} using proxy ${proxyUrl}:`, error);
      // Continue to next proxy on failure
      continue;
    }
  }

  // If all proxies failed, log the error and return empty array
  console.error(`All proxies failed for ${sourceName}. Last error:`, lastError);
  return [];
};

// Function to fetch news from all sources
export const fetchNewsFromAllSources = async (): Promise<Article[]> => {
  // Check if we have valid cached data
  const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
  const now = new Date().getTime();
  
  if (cachedTimestamp && (now - parseInt(cachedTimestamp)) < CACHE_DURATION) {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
  }
  
  // If no valid cache, fetch fresh data
  try {
    const promises = news_sources.map(source => 
      fetchRssFeed(source.url, source.name)
    );
    
    const results = await Promise.allSettled(promises);
    const articles = results
      .filter((result): result is PromiseFulfilledResult<Article[]> => result.status === 'fulfilled')
      .map(result => result.value)
      .flat();
    
    // Sort by date (newest first)
    articles.sort((a, b) => 
      new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    );
    
    // Cache the results
    localStorage.setItem(CACHE_KEY, JSON.stringify(articles));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
    
    return articles;
  } catch (error) {
    console.error('Error fetching news:', error);
    
    // Try to return cached data even if it's expired
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    return [];
  }
};