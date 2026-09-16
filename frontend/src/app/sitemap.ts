import type { MetadataRoute } from 'next'

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  {
    url: 'https://tennisace.live',
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1.0,
  },
  {
    url: 'https://tennisace.live/sparring',
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.9,
  },
  {
    url: 'https://tennisace.live/play',
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.9,
  },
  {
    url: 'https://tennisace.live/community',
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  },
  {
    url: 'https://tennisace.live/community/Barcelona',
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.9,
  },
  {
    url: 'https://tennisace.live/community/Dubai',
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.8,
  },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return STATIC_ROUTES
}
