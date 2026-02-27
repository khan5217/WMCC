import type { Metadata } from 'next'
import { MapPin, Phone, Mail, Users, Trophy, Heart, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about WMCC Milton Keynes Cricket Club — our history, values, ground, and committee.',
}

export default function AboutPage() {
  return (
    <>
      {/* Page header */}
      <div className="hero-gradient pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white font-serif mb-3">About WMCC</h1>
          <p className="text-xl text-green-100">Our story, our values, our community.</p>
        </div>
      </div>

      {/* History */}
      <section className="section-padding bg-white">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <h2 className="section-title mb-4">Our History</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  WMCC Milton Keynes Cricket Club was founded in 1985 with a simple vision: to bring
                  competitive and community cricket to Milton Keynes. What started as a handful of
                  passionate cricket lovers has grown into one of the most respected clubs in the region.
                </p>
                <p>
                  Over nearly four decades, WMCC has nurtured hundreds of cricketers, from absolute beginners
                  picking up a bat for the first time to seasoned players competing at league level. Our club
                  has always been built on the values of sportsmanship, inclusivity, and a love of the game.
                </p>
                <p>
                  Today, WMCC fields two teams in the South Northants Cricket League and continues to grow
                  each season. We are proud members of the England and Wales Cricket Board (ECB) and
                  Northamptonshire Cricket Board.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Trophy, label: 'League Winners', value: '8×' },
                { icon: Users, label: 'Players Developed', value: '500+' },
                { icon: Heart, label: 'Years of Cricket', value: '39+' },
                { icon: Shield, label: 'Active Members', value: '120+' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="card p-6 text-center">
                  <Icon className="h-8 w-8 text-cricket-green mx-auto mb-3" />
                  <div className="text-3xl font-bold text-gray-900 font-serif">{value}</div>
                  <div className="text-sm text-gray-500 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-gray-50">
        <div className="container-max">
          <div className="text-center mb-12">
            <h2 className="section-title">Our Values</h2>
            <p className="section-subtitle">What makes WMCC special</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Inclusivity',
                desc: 'Cricket is for everyone. We welcome players of all ages, backgrounds, and skill levels. No experience necessary — we will teach you.',
                emoji: '🤝',
              },
              {
                title: 'Sportsmanship',
                desc: 'We play hard but fair. Win or lose, WMCC players are known for their positive attitude and respect for opponents and officials.',
                emoji: '🏆',
              },
              {
                title: 'Community',
                desc: 'We are more than a cricket club. We are a family — supporting each other on and off the field, volunteering and giving back to Milton Keynes.',
                emoji: '🌍',
              },
            ].map((v) => (
              <div key={v.title} className="card p-8 text-center">
                <div className="text-5xl mb-4">{v.emoji}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{v.title}</h3>
                <p className="text-gray-600 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Committee */}
      <section className="section-padding bg-white">
        <div className="container-max">
          <div className="text-center mb-12">
            <h2 className="section-title">Club Committee</h2>
            <p className="section-subtitle">The people who keep WMCC running</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { role: 'Chairman', name: 'TBA', contact: '' },
              { role: 'Club Secretary', name: 'TBA', contact: 'secretary@wmcc.co.uk' },
              { role: '1st XI Captain', name: 'TBA', contact: '' },
              { role: '2nd XI Captain', name: 'TBA', contact: '' },
              { role: 'Treasurer', name: 'TBA', contact: '' },
              { role: 'Fixtures Secretary', name: 'TBA', contact: '' },
              { role: 'Welfare Officer', name: 'TBA', contact: '' },
              { role: 'Ground Manager', name: 'TBA', contact: '' },
            ].map((member) => (
              <div key={member.role} className="card p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Users className="h-8 w-8 text-cricket-green" />
                </div>
                <div className="font-bold text-gray-900">{member.name}</div>
                <div className="text-sm text-cricket-green font-medium mt-0.5">{member.role}</div>
                {member.contact && (
                  <a href={`mailto:${member.contact}`} className="text-xs text-gray-400 hover:text-cricket-green mt-1 block">
                    {member.contact}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ground info */}
      <section className="section-padding bg-gray-50">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="section-title mb-4">Our Ground</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Our home ground is situated in the heart of Milton Keynes. The ground features a
                well-maintained playing surface, a pavilion with changing facilities, and a clubhouse
                where members, players, and supporters can enjoy refreshments.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-cricket-green mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-900">WMCC Cricket Ground</div>
                    <div className="text-gray-500 text-sm">Milton Keynes, MK1 1AA</div>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-cricket-green" />
                  <a href="mailto:info@wmcc.co.uk" className="text-gray-600 hover:text-cricket-green">info@wmcc.co.uk</a>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-cricket-green" />
                  <a href="tel:+447000000000" className="text-gray-600 hover:text-cricket-green">+44 7000 000000</a>
                </li>
              </ul>
            </div>
            {/* Map placeholder */}
            <div className="h-64 bg-green-50 rounded-xl border-2 border-dashed border-green-200 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <MapPin className="h-10 w-10 mx-auto mb-2" />
                <div className="font-medium">Google Maps</div>
                <div className="text-sm">Embedded map will appear here</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
