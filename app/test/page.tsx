'use client';


export default function TestPage() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Component Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold">Test Component Area</h2>
          <p className="text-gray-600">Components can be tested here</p>
        </div>
      </div>
    </div>
  );
} 