import { MainTabs } from '@/components/layout/MainTabs';

// Force page to revalidate on every request to prevent caching issues
export const revalidate = 0

export default function DashboardPage() {
  return <MainTabs defaultTab="assets" />;
} 