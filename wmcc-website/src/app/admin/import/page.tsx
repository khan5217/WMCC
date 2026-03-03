'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Upload, Download } from 'lucide-react'

type ImportType = 'matches' | 'players'

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map((line) => {
    // Basic CSV split (handles simple quoted fields)
    const values: string[] = []
    let cur = ''
    let inQuotes = false
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue }
      if (ch === ',' && !inQuotes) { values.push(cur.trim()); cur = ''; continue }
      cur += ch
    }
    values.push(cur.trim())
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  })
}

const MATCH_TEMPLATE = `date,opposition,venue,team,is_home,format,result,wmcc_score,wmcc_overs,opp_score,opp_overs,top_scorer,top_scorer_runs,top_bowler,top_bowler_wickets,cricheroes_url,league,description
2024-06-01,Northampton CC,Crownhill Cricket Ground,WMCC 1st XI,true,ONE_DAY,WIN,187/6,40,183/8,39.4,J. Smith,78,A. Khan,4,https://cricheroes.com/...,South Northants League,Great win`

const PLAYER_TEMPLATE = `name,matches,runs,highest_score,batting_avg,strike_rate,wickets,best_bowling,bowling_avg,economy,cricheroes_url
John Smith,24,876,98,42.5,88.3,12,4/32,28.1,5.6,https://cricheroes.com/player-profile/...`

export default function ImportPage() {
  const [type, setType] = useState<ImportType>('matches')
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ created: number; errors: string[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setResult(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target?.result as string)
      setRows(parsed)
      toast.success(`Parsed ${parsed.length} rows`)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!rows.length) { toast.error('No rows to import'); return }
    setLoading(true)
    try {
      const res = await axios.post('/api/import', { type, rows })
      setResult(res.data)
      toast.success(`Imported ${res.data.created} records`)
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const content = type === 'matches' ? MATCH_TEMPLATE : PLAYER_TEMPLATE
    const blob = new Blob([content], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wmcc_${type}_template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin" className="text-gray-400 hover:text-gray-600 text-sm">← Admin</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">CSV Import</h1>
      </div>

      <div className="card p-6 space-y-6">
        {/* Type selector */}
        <div>
          <label className="label">What are you importing?</label>
          <div className="flex gap-3 mt-1">
            {(['matches', 'players'] as ImportType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setType(t); setRows([]); setFileName(''); setResult(null) }}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${type === t ? 'bg-cricket-green text-white border-cricket-green' : 'border-gray-200 text-gray-600 hover:border-cricket-green'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-semibold mb-1">How to import from CricHeroes:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            {type === 'matches' ? (
              <>
                <li>Download the template below and fill in your match data</li>
                <li>For each match on CricHeroes, paste the scorecard URL in the <code>cricheroes_url</code> column</li>
                <li>Fill in the top scorer and bowler from the CricHeroes scorecard</li>
                <li>Upload the completed CSV and click Import</li>
              </>
            ) : (
              <>
                <li>Download the template and fill in player names (must match names in the member system)</li>
                <li>Copy career stats from each player's CricHeroes profile page</li>
                <li>Paste the player's CricHeroes profile URL in the <code>cricheroes_url</code> column</li>
                <li>Upload the CSV and click Import</li>
              </>
            )}
          </ol>
        </div>

        {/* Template download */}
        <button onClick={downloadTemplate} className="btn-secondary flex items-center gap-2 text-sm">
          <Download className="h-4 w-4" /> Download CSV Template
        </button>

        {/* File upload */}
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-cricket-green transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">{fileName || 'Click to upload CSV file'}</p>
          {rows.length > 0 && <p className="text-xs text-cricket-green mt-1">{rows.length} rows ready to import</p>}
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
        </div>

        {/* Preview */}
        {rows.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="text-xs w-full">
              <thead className="bg-gray-50">
                <tr>{Object.keys(rows[0]).map((h) => <th key={h} className="px-3 py-2 text-left text-gray-500 whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.slice(0, 5).map((row, i) => (
                  <tr key={i}>{Object.values(row).map((v, j) => <td key={j} className="px-3 py-2 text-gray-700 whitespace-nowrap max-w-[120px] truncate">{v}</td>)}</tr>
                ))}
              </tbody>
            </table>
            {rows.length > 5 && <p className="text-xs text-gray-400 text-center py-2">…and {rows.length - 5} more rows</p>}
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={loading || rows.length === 0}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {loading ? 'Importing...' : `Import ${rows.length} ${type}`}
        </button>

        {/* Results */}
        {result && (
          <div className={`rounded-lg p-4 text-sm ${result.errors.length === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <p className="font-semibold mb-1">✅ {result.created} records imported successfully</p>
            {result.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-yellow-800 mb-1">Errors ({result.errors.length}):</p>
                {result.errors.map((e, i) => <p key={i} className="text-xs text-yellow-700">{e}</p>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
