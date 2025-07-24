import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-base-100">
      <div className="navbar bg-primary text-primary-content">
        <div className="flex-1">
          <Link href="/" className="btn btn-ghost text-xl">
            Codex Bootstrap
          </Link>
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal px-1">
            <li><Link href="/about">About</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>
      </div>

      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">Hello there!</h1>
            <p className="py-6">
              Welcome to Codex Bootstrap - a full-stack starter template with Next.js, TypeScript, 
              DaisyUI, Zustand, React Query, and FastAPI backend.
            </p>
            <button className="btn btn-primary">Get Started</button>
          </div>
        </div>
      </div>
    </main>
  )
}
