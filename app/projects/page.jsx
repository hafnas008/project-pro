'use client'
import { useState, useEffect } from 'react'
import { getSupabase } from '../../lib/supabase'
import { sendWhatsApp } from '../../lib/notify'
import Link from 'next/link'
import toast from 'react-hot-toast'

const STATUS_STYLE = {
  active:'bg-emerald-100 text-emerald-700',
  on_hold:'bg-amber-100 text-amber-700',
  completed:'bg-blue-100 text-blue-700',
  cancelled:'bg-red-100 text-red-700'
}

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const sb = getSupabase()

  useEffect(() => {
    Promise.all([
      sb.from('pm_projects').select('*').eq('organization_id','default').order('created_at',{ascending:false}),
      sb.from('pm_tasks').select('id,project_id,project_name,status').eq('organization_id','default')
    ]).then(([{data:p},{data:t}]) => { setProjects(p||[]); setTasks(t||[]); setLoading(false) })
  }, [])

  const filtered = filter==='all' ? projects : projects.filter(p=>p.status===filter)

  const getProgress = (proj) => {
    const pt = tasks.filter(t=>t.project_id===proj.id||t.project_name===proj.name)
    if (!pt.length) return {pct:0,done:0,total:0}
    const done = pt.filter(t=>t.status==='done').length
    return {pct:Math.round(done/pt.length*100),done,total:pt.length}
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Projects</h1>
          <p className="text-slate-500 mt-1">{projects.length} projects total</p>
        </div>
        <Link href="/projects/new" className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{background:'#7C3AED'}}>
          + New Project
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        {['all','active','on_hold','completed'].map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all`}
            style={filter===f?{background:'#7C3AED',color:'white'}:{background:'white',border:'1px solid #e2e8f0',color:'#475569'}}>
            {f==='all'?'All Projects':f.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-5">{[...Array(3)].map((_,i)=><div key={i} className="h-48 bg-slate-200 rounded-xl animate-pulse"/>)}</div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {filtered.map(p => {
            const {pct,done,total} = getProgress(p)
            return (
              <div key={p.id} className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-slate-800">{p.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[p.status]||'bg-slate-100 text-slate-600'}`}>{p.status}</span>
                  </div>
                  {p.description && <p className="text-sm text-slate-500 mb-3 line-clamp-2">{p.description}</p>}
                  {p.location && <div className="text-xs text-slate-400 mb-3">📍 {p.location}</div>}
                  {p.budget > 0 && <div className="text-sm font-semibold text-slate-700 mb-3">QAR {Number(p.budget).toLocaleString()}</div>}
                  <div className="mb-1.5 flex justify-between text-xs text-slate-500">
                    <span>Progress</span><span>{done}/{total} tasks ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full mb-4">
                    <div className="h-full rounded-full" style={{width:`${pct}%`,background:'#7C3AED'}}/>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/tasks?project=${encodeURIComponent(p.name)}`} className="flex-1 text-center text-xs py-1.5 rounded-lg bg-violet-50 text-violet-700 font-medium hover:bg-violet-100">
                      Tasks
                    </Link>
                    <Link href="/updates/new" className="flex-1 text-center text-xs py-1.5 rounded-lg bg-sky-50 text-sky-700 font-medium hover:bg-sky-100">
                      Update
                    </Link>
                    <button onClick={async()=>{
                      await sendWhatsApp(`📊 *Project Status*\n\n*${p.name}*\nStatus: ${p.status}\nProgress: ${pct}%\nTasks: ${done}/${total} done${p.location?'\nLocation: '+p.location:''}`)
                      toast.success('Status sent!')
                    }} className="flex-1 text-center text-xs py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100">
                      📱 Share
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          {filtered.length===0 && (
            <div className="col-span-3 text-center py-16 text-slate-400">
              No projects found. <Link href="/projects/new" className="text-violet-600">Create one →</Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
