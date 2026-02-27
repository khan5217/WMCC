import Link from 'next/link'
import { ChevronRight, Users, Star, Shield } from 'lucide-react'

export function JoinCTA() {
  return (
    <section className="hero-gradient py-20 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-10 w-64 h-64 rounded-full border-4 border-white" />
        <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full border-4 border-white" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold text-white font-serif mb-4">
          Ready to Join WMCC?
        </h2>
        <p className="text-xl text-green-100 mb-10 max-w-2xl mx-auto">
          Whether you&apos;re an experienced cricketer or just picking up a bat for the first time,
          there&apos;s a place for you at WMCC.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Users, title: 'All Skill Levels', desc: 'From beginners to experienced players' },
            { icon: Star, title: 'Competitive Cricket', desc: 'League cricket in two teams' },
            { icon: Shield, title: 'Great Community', desc: 'Friendly, welcoming, inclusive club' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-center">
              <Icon className="h-8 w-8 text-green-300 mx-auto mb-3" />
              <div className="text-white font-semibold mb-1">{title}</div>
              <div className="text-green-200 text-sm">{desc}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/membership" className="btn-outline-white inline-flex items-center gap-2 text-lg px-8 py-4">
            Join Now <ChevronRight className="h-5 w-5" />
          </Link>
          <Link href="/contact" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all">
            Get in Touch
          </Link>
        </div>
      </div>
    </section>
  )
}
