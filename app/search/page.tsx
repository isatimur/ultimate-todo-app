import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { SearchView } from '@/components/search-view';

export const metadata = {
  title: 'Search | Ultimate Todo App',
  description: 'Search through your tasks and projects',
};

export default async function SearchPage() {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/signin');
  }

  return (
    <div className="flex-1 overflow-hidden">
      <SearchView />
    </div>
  );
} 