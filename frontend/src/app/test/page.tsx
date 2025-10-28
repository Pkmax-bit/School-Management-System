/**
 * Test Page
 * Trang test không cần Supabase
 */

'use client';

import { useState } from 'react';

export default function TestPage() {
  const [message, setMessage] = useState('Test page hoạt động!');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Test Page
          </h1>
          <p className="mt-2 text-gray-600">
            {message}
          </p>
          <button
            onClick={() => setMessage('Button clicked!')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Click me
          </button>
        </div>
      </div>
    </div>
  );
}
