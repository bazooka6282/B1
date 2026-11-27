import type { MetadataRoute } from 'next';
import { getFleet } from '../lib/public-fleet';
import { siteOrigin } from '../lib/site';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fleet = await getFleet();
  return [
    { url: siteOrigin + '/' },
    ...fleet.map(({ registration }) => ({ url: siteOrigin + '/fleet/' + registration })),
  ];
}
