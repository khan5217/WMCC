'use client'

import { useState } from 'react'
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post('/api/contact', form)
      toast.success('Message sent! We\'ll get back to you soon.')
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch {
      toast.error('Failed to send message. Please try emailing us directly.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="hero-gradient pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white font-serif mb-3">Contact Us</h1>
          <p className="text-xl text-green-100">Get in touch with WMCC Milton Keynes Cricket Club</p>
        </div>
      </div>

      <div className="section-padding bg-white">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Contact info */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">We&apos;d love to hear from you</h2>
                <p className="text-gray-600">Whether you want to join the club, sponsor us, or just have a question — please reach out!</p>
              </div>

              {[
                {
                  icon: MapPin,
                  title: 'Club Ground',
                  lines: ['WMCC Cricket Ground', 'Milton Keynes, MK1 1AA'],
                },
                {
                  icon: Phone,
                  title: 'Phone',
                  lines: ['+44 7000 000000'],
                  href: 'tel:+4470000000000',
                },
                {
                  icon: Mail,
                  title: 'Email',
                  lines: ['info@wmcc.co.uk', 'secretary@wmcc.co.uk'],
                  href: 'mailto:info@wmcc.co.uk',
                },
                {
                  icon: Clock,
                  title: 'Office Hours',
                  lines: ['Match days: 10am – 8pm', 'Nets: Tue & Thu 6:30pm'],
                },
              ].map(({ icon: Icon, title, lines, href }) => (
                <div key={title} className="flex gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-cricket-green" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 mb-0.5">{title}</div>
                    {lines.map((line, i) => (
                      href && i === 0 ? (
                        <a key={line} href={href} className="text-gray-600 hover:text-cricket-green block text-sm">{line}</a>
                      ) : (
                        <div key={line} className="text-gray-600 text-sm">{line}</div>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Contact form */}
            <div className="lg:col-span-3">
              <div className="card p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Send us a message</h3>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="label">Your Name *</label>
                      <input
                        className="input"
                        type="text"
                        required
                        placeholder="John Smith"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Email Address *</label>
                      <input
                        className="input"
                        type="email"
                        required
                        placeholder="john@example.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="label">Phone Number</label>
                      <input
                        className="input"
                        type="tel"
                        placeholder="+44 7000 000000"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Subject *</label>
                      <select
                        className="input"
                        required
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      >
                        <option value="">Select subject...</option>
                        <option value="Joining the club">Joining the Club</option>
                        <option value="Sponsorship">Sponsorship</option>
                        <option value="Ground hire">Ground Hire</option>
                        <option value="General enquiry">General Enquiry</option>
                        <option value="Junior cricket">Junior Cricket</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label">Message *</label>
                    <textarea
                      className="input h-36 resize-none"
                      required
                      placeholder="How can we help you?"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
