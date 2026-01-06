import Link from 'next/link';

export default function TestEnvPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Test</h1>

      <div className="space-y-4">
        <div>
          <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>
          <div className={`p-2 rounded ${supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {supabaseUrl || 'Not set'}
          </div>
        </div>

        <div>
          <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>
          <div className={`p-2 rounded ${supabaseKey ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {supabaseKey ? `Set (length: ${supabaseKey.length})` : 'Not set'}
          </div>
        </div>

        <div>
          <strong>Status:</strong>
          <div className={`p-2 rounded ${supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co' && supabaseKey ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co' && supabaseKey
              ? '✅ Environment variables loaded correctly'
              : '❌ Missing or invalid environment variables'
            }
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Link href="/" className="text-blue-600 hover:underline">← Back to home</Link>
      </div>
    </div>
  );
}
