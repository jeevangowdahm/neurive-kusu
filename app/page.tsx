import { getHomepageData } from '@/lib/homepage-data';
import HomePageClient from './homepage-client';

export const revalidate = 60;

export default async function HomePage() {
  let data = null;
  try {
    data = await getHomepageData();
  } catch (err) {
    console.error('Failed to fetch homepage data:', err);
  }

  return <HomePageClient data={data} />;
}
