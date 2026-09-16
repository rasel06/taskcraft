// app/login/error.tsx
'use client' // Error boundaries MUST be Client Components

import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // This logs the true client-accessible error or digest ID
        console.error('Triggered UI Error Boundary:', error.message, error.digest)
    }, [error])

    return (
        <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md space-y-4 text-center mt-20">
            <h2 className="text-xl font-bold text-red-600">Something went wrong!</h2>
            <p className="text-gray-500 text-sm">We encountered a problem loading this section.</p>
            <button
                onClick={() => reset()} // Try to safely recover by re-rendering
                className="mt-2 px-4 py-2 bg-black text-white text-sm font-medium rounded hover:bg-gray-800"
            >
                Try Again
            </button>
        </div>
    )
}
