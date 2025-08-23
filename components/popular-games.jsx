import Link from "next/link"

export function PopularGames() {
  const games = [
    {
      name: "eFootball 2026",
      image: "/eFootball2026.jpg", // Local placeholder to avoid DNS resolution issues
      players: "1.8K",
      slug: "/efootball-2026", // Added slug for URL routing
    },
    {
      name: "FC Mobile",
      image: "/EA FC26.jpg", // Local placeholder to avoid DNS resolution issues
      players: "1.2K",
      slug: "fc-mobile", // Added slug for URL routing
    },
  ]

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Popular <span className="gradient-text">Games</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-2xl mx-auto">
          {games.map((game) => (
            <Link key={game.name} href={`/tournaments?game=${game.slug}`} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-xl bg-slate-800/80 glass-effect hover-lift hover:bg-slate-700/90 transition-all duration-300 border border-slate-700/50 hover:border-blue-500/50">
                <img
                  src={game.image || "/placeholder.svg"}
                  alt={game.name}
                  className="w-full h-24 md:h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="p-2 md:p-3">
                  <h3 className="font-semibold text-white text-xs md:text-sm mb-1 line-clamp-2">{game.name}</h3>
                  <p className="text-xs text-gray-400">{game.players} players</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
