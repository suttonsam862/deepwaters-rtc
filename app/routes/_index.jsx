import {useEffect, useRef} from 'react';
import {useLoaderData} from 'react-router';

/**
 * Hand the PUBLIC Supabase config to the client. These are public values
 * (the anon key is meant to be public); security is enforced by Supabase
 * Row Level Security, not by hiding the key.
 */
export async function loader({context}) {
  const env = context.env || {};
  return {
    SUPABASE_URL: env.PUBLIC_SUPABASE_URL || '',
    SUPABASE_ANON_KEY: env.PUBLIC_SUPABASE_ANON_KEY || '',
  };
}

export const meta = () => [
  {title: 'Deep Waters RTC — Coaching Ledger'},
  {name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover'},
];

export default function Home() {
  const {SUPABASE_URL, SUPABASE_ANON_KEY} = useLoaderData();
  const ref = useRef(null);

  useEffect(() => {
    let cleanup;
    let active = true;
    import('~/lib/tracker-app').then((m) => {
      if (active && ref.current) {
        cleanup = m.mount(ref.current, {SUPABASE_URL, SUPABASE_ANON_KEY});
      }
    });
    return () => {
      active = false;
      if (cleanup) cleanup();
    };
  }, [SUPABASE_URL, SUPABASE_ANON_KEY]);

  return <div ref={ref} suppressHydrationWarning />;
}
