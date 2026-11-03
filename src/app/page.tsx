import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { StudyAIClient } from '@/components/studyai/StudyAIClient';

// User-specific authentication must not be cached as a static page.
export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Public visitors receive real landing-page HTML rather than a loading
  // spinner. Signed-in visitors keep the existing dashboard loading behavior.
  return <StudyAIClient initiallyAuthenticated={Boolean(session)} />;
}
