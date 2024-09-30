ååimport { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import UltimateTodoAppComponent2 from '@/components/ultima-todo-app-component';

export default async function Page() {

  const supabase = createServerComponentClient({ cookies });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('Error fetching user:', error.message);
  }

  if (!user) {
    return redirect('/signin');
  }

  return <UltimateTodoAppComponent2 />;
}
