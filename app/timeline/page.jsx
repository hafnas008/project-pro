'use client'
import { useState, useEffect } from 'react'
import { getSupabase } from '../../lib/supabase'
import { sendWhatsApp } from '../../lib/notify'
import Link from 'next/link'
import toast from 'react-hot-toast'

const COLORS = ['#7C3AED','#0EA5E9','#10B981','#F59E0B','#EF4444','#8B5CF6']

export default function Timeline() {
  const [projects, setProjects] = useState([])
  const [updates, setUpdates] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const sb = getSupabase()

  useEffect(()=>{
    Promise.all([
      sb.from('pm_projects').select('*').eq('organization_id','default'),
      sb.from('pm_updates').select('*').eq('organization_id','default').order('update_date',{ascending:false}).limit(10),
      sb.from('pm_tasks').select('id,project_id,project_name,status').eq('organization_id','default')
    ]).then(([{data:p},{data:u},{data:t}])=>{ setProjects(p||[]); setUpdates(u||[]); setTasks(t||[]); setLoading(false) })
  },[])

  const getProgress = (proj) => {
    const pt = tasks.filter(t=>t.project_id===proj.id||t.project_name===proj.name)
    if (!pt.length) return 0
    return Math.round(pt.filter(t=>t.status==='done').length/pt.length*100)
  }

  const dated = projects.filter(p=>p.start_date&&p.end_date)
  let minDate = dated.length ? new Date(Math.min(...dated.map(p=>new Date(p.start_date)))) : new Date()
  let maxDate = dated.length ? new Date(Math.max(...dated.map(p=>new Date(p.end_date)))) : new Date(Date.now()+86400000*90)
  const totalDays = Math.max(1, (maxDate-minDate)/86400000)

  function getBarStyle(p, idx) {
    if (!p.start_date||!p.end_date) return null
    const start = (new Date(p.start_date)-minDate)/86400000/totalDays*100
    const width = (new Date(p.end_date)-new Date(p.start_date))/86400000/totalDays*100
    return {left:`${Math.max(0,start)}%`,width:`${Math.max(2,width)}%`,background:COLORS[idx%COLORS.length]}
  }

  const months = []
  let cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
  while (cur <= maxDate) { months.push(new Date(cur)); cur = new Date(cur.getFullYear(), cur.getMonth()+1, 1) }

  if (loading) return <div className="p-8"><div className="animate-pulse h-64 bg-slate-200 rounded-xl"/></div>

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Timeline</h1>
          <p className="text-slate-500 mt-1">Project schedule and progress</p>
        </div>
        <button onClick={async()=>{
          const msg = `📅 *Project Timeline Update*\n\n`+projects.slice(0,5).map(p=>`• ${p.name}: ${getProgress(p)}% complete`).join('\n')
          await sendWhatsApp(msg); toast.success('Timeline shared!')
        }} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{background:'#7C3AED'}}>
          📱 Share Timeline
        </button>
      </div>

      {dated.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm mb-6 overflow-hidden">
          <div className="border-b border-slate-100 px-4 pt-4">
            <div className="ml-40 relative h-6">
              {months.map((m,i) => {
                const pos = (m-minDate)/86400000/totalDays*100
                return (
                  <div key={i} className="absolute text-xs text-slate-400 font-medium" style={{left:`${pos}%`}}>
                    {m.toLocaleDateString('en-US',{month:'short',year:'2-digit'})}
                  </div>
                )
              })}
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {projects.map((p,idx)=>{
              const style = getBarStyle(p,idx)
              const pct = getProgress(p)
              return (
                <div key={p.id} className="flex items-center px-4 py-3 hover:bg-slate-50/50">
                  <div className="w-40 flex-shrink-0 pr-3">
                    <div className="text-sm font-medium text-slate-800 truncate">{p.name}</div>
                    <div className="text-xs text-slate-400">{pct}% done</div>
                  </div>
                  <div className="flex-1 relative h-7">
                    {style ? (
                      <div className="absolute h-full rounded-full opacity-90 flex items-center px-2 overflow-hidden" style={style}>
                        <div className="h-full rounded-full bg-white/30 absolute left-0 top-0" style={{width:`${pct}%`}}/>
                        <span className="text-xs text-white font-semibold z-10 relative truncate">{p.name} {pct}%</span>
                      </div>
                    ) : (
                      <div className="h-full bg-slate-100 rounded flex items-center px-2">
                        <span className="text-xs text-slate-400">No dates set</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 mb-6">
          Add start and end dates to projects to see the Gantt chart. Set dates via <Link href="/projects" className="underline">Projects page</Link>.
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-semibold text-slate-800">Recent Updates</h2>
          <Link href="/updates/new" className="text-sm text-violet-600 hover:underline">+ Log Update</Link>
        </div>
        <div className="divide-y divide-slate-50">
          {updates.map(u=>(
            <div key={u.id} className="px-5 py-4 flex gap-4">
              <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{background:'#7C3AED'}}/>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{u.title}</div>
                    <div className="text-xs text-violet-600 mt-0.5">{u.project_name||'General'}{u.stage?' — '+u.stage:''}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">{new Date(u.update_date).toLocaleDateString()}</div>
                    {u.progress_pct!=null&&<div className="text-sm font-bold text-violet-600 mt-0.5">{u.progress_pct}%</div>}
                  </div>
                </div>
                {u.description&&<p className="text-sm text-slate-500 mt-1">{u.description}</p>}
              </div>
            </div>
          ))}
          {updates.length===0&&<p className="text-center text-slate-400 py-8 text-sm">No updates logged yet.</p>}
        </div>
      </div>
    </div>
  )
}
