/**
 * Test page to verify app loads
 */

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-oilers-orange mb-6">✓ App is Loading</h1>
        <p className="text-lg text-gray-300 mb-4">
          If you can see this page, Next.js is compiling correctly.
        </p>
        <div className="bg-gray-800 rounded p-6 mb-6">
          <h2 className="text-xl font-bold text-orange-400 mb-4">Server Info:</h2>
          <ul className="space-y-2 text-gray-300">
            <li>✓ Next.js is running</li>
            <li>✓ TypeScript compiled</li>
            <li>✓ Tailwind CSS loaded</li>
          </ul>
        </div>
        <a
          href="/"
          className="inline-block bg-oilers-orange text-white px-6 py-3 rounded font-bold hover:bg-opacity-90"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
