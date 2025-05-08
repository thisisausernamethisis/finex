export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-6">Finex Bot</h1>
        <p className="text-xl mb-4">AI-powered research workspace for financial analysts</p>
        <ul className="list-disc ml-5 mb-6">
          <li>Curate assets</li>
          <li>Define scenarios</li>
          <li>Capture evidence in hierarchical Themes → Cards → Chunks</li>
          <li>View a Matrix of Impact vs Growth % vs Risk</li>
        </ul>
      </div>
    </main>
  )
}
