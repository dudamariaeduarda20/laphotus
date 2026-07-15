import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://laphotus.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/photos`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/discover-events`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/fotografo`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/organizador`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/auth/login`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/auth/register`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Fetch dynamic pages (events)
  let dynamicPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${baseUrl}/api/events?limit=1000`, {
      next: { revalidate: 86400 }, // Cache for 24h
    });
    if (res.ok) {
      const data = await res.json();
      dynamicPages = (data.events || []).map((event: any) => ({
        url: `${baseUrl}/photos/${event.id}`,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
  } catch (err) {
    console.error('Sitemap fetch error:', err);
  }

  return [...staticPages, ...dynamicPages];
}
