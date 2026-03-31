"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-12 text-center">
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-10 max-w-md">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-lg font-semibold text-stone-800 mb-2">Backend not reachable</h1>
        <p className="text-sm text-stone-500 mb-6">
          The API server isn&apos;t running. Double-click the <strong>Real Estate Tracker</strong> shortcut to start the app, then try again.
        </p>
        <button
          onClick={reset}
          className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
