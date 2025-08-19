import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-slate-900 border-t border-slate-700">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="text-xl font-bold text-white">EsTournaments</span>
            </div>
            <p className="text-gray-400 text-sm">The ultimate platform for competitive gaming tournaments.</p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Tournaments</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/tournaments" className="text-gray-400 hover:text-white">
                  Browse All
                </Link>
              </li>
              <li>
                <Link href="/tournaments/create" className="text-gray-400 hover:text-white">
                  Create Tournament
                </Link>
              </li>
              <li>
                <Link href="/games" className="text-gray-400 hover:text-white">
                  Popular Games
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Community</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/leaderboards" className="text-gray-400 hover:text-white">
                  Leaderboards
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-gray-400 hover:text-white">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Get Started</h3>
            <div className="space-y-3">
              <Link href="/auth/sign-up">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Join Now</Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">© {currentYear} EsTournaments. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
