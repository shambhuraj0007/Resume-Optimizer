import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Add any routes you want to hide from Google here:
      // disallow: ['/private/', '/admin/'], 
    },
    // Make sure this matches your actual domain
    sitemap: 'https://shortlistai.cv/sitemap.xml', 
  };
}