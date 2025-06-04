export interface NewsSource {
  name: string;
  url: string;
  category?: string;
}

export const news_sources: NewsSource[] = [
  {
    name: "TechCrunch",
    url: "https://techcrunch.com/feed/",
    category: "Technology"
  },
  {
    name: "The Verge",
    url: "https://www.theverge.com/rss/index.xml",
    category: "Technology"
  },
  {
    name: "Wired",
    url: "https://www.wired.com/feed/rss",
    category: "Technology"
  },
  {
    name: "BBC News",
    url: "http://feeds.bbci.co.uk/news/world/rss.xml",
    category: "International"
  },
  {
    name: "The Times of India",
    url: "https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms",
    category: "Top Stories"
  },
  {
    name: "Hindustan Times",
    url: "https://www.hindustantimes.com/feeds/rss/topnews/rssfeed.xml",
    category: "Top Stories"
  },
  {
    name: "The Hindu - National",
    url: "https://www.thehindu.com/news/national/feeder/default.rss",
    category: "National"
  },
  {
    name: "NDTV",
    url: "https://feeds.feedburner.com/ndtvnews-top-stories",
    category: "Top Stories"
  },
  {
    name: "Economic Times",
    url: "https://economictimes.indiatimes.com/rss/topstories.cms",
    category: "Business"
  },
  {
    name: "Moneycontrol",
    url: "https://www.moneycontrol.com/rss/MCtopnews.xml",
    category: "Business"
  },
  {
    name: "Gadgets360",
    url: "https://gadgets360.com/rss/news",
    category: "Technology"
  },
  {
    name: "Digit India",
    url: "https://www.digit.in/rss/news.xml",
    category: "Technology"
  },
  {
    name: "The Hindu - International",
    url: "https://www.thehindu.com/news/international/feeder/default.rss",
    category: "International"
  },
  {
    name: "NDTV World",
    url: "https://feeds.feedburner.com/ndtvnews-world-news",
    category: "International"
  },
  {
    name: "Bollywood Hungama",
    url: "https://www.bollywoodhungama.com/rss/news.xml",
    category: "Entertainment"
  },
  {
    name: "TOI Entertainment",
    url: "https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms",
    category: "Entertainment"
  },
  {
    name: "ESPN Cricinfo",
    url: "https://www.espncricinfo.com/rss/content/story/feeds/0.xml",
    category: "Sports"
  },
  {
    name: "TOI Sports",
    url: "https://timesofindia.indiatimes.com/rssfeeds/4719148.cms",
    category: "Sports"
  },
  {
    name: "NDTV Sports",
    url: "https://feeds.feedburner.com/ndtvsports-latest",
    category: "Sports"
  },
  {
    name: "Jagran",
    url: "https://www.jagran.com/rss/news/national.xml",
    category: "Hindi News"
  },
  {
    name: "Dainik Bhaskar",
    url: "https://www.bhaskar.com/rss-national/",
    category: "Hindi News"
  },
  // Add these to your news_sources array
{
  name: "News18 Bihar",
  url: "https://www.news18.com/rss/bihar.xml",
  category: "Regional"
},
{
  name: "Amar Ujala Bihar",
  url: "https://www.amarujala.com/rss/bihar-news.xml", 
  category: "Regional"
},
{
  name: "Prabhat Khabar",
  url: "https://www.prabhatkhabar.com/rss.xml",
  category: "Regional"
},
{
  name: "ABP Ananda",
  url: "https://bengali.abplive.com/rss.xml",
  category: "Regional"
}
];
