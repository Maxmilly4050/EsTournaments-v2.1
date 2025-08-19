import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { PopularGames } from "@/components/popular-games"
import { TournamentSection } from "@/components/tournament-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header />
      <main>
        <HeroSection />
        <PopularGames />
        <TournamentSection key="upcoming" title="Upcoming tournaments" status="upcoming" />
        <TournamentSection key="ongoing" title="Ongoing tournaments" status="ongoing" />
      </main>
      <Footer />
    </div>
  )
}
