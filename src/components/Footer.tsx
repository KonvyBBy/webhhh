import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#0d1117] border-t border-[#30363d] mt-auto">
      <div className="max-w-[1280px] mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-8 justify-center">
          <Link href="/" className="text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors">Home</Link>
          <Link href="/fortnite" className="text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors">Fortnite</Link>
          <Link href="/riot" className="text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors">Valorant</Link>
          <Link href="/dashboard" className="text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors">Dashboard</Link>
          <Link href="/orders" className="text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors">Orders</Link>
        </div>
        <div className="mt-4 pt-4 border-t border-[#21262d] text-center">
          <p className="text-xs text-[#8b949e]">&copy; {new Date().getFullYear()} LZT Market. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
