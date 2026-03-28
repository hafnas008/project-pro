'use client'
import { useState, useEffect } from 'react'
import { getSupabase } from '../../lib/supabase'
import { sendWhatsApp } from '../../lib/notify'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function Updates() {
  const [updates, setUpdates] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [projF, setProjF] = useState('')
  const sb = getSupabase()

  useEffect(()=>{
    Promise.all([
      sb.from('pm_updates').select('*').eq('organization_id','default').order('update_date',{ascending:false}),
      sb.from('pm_projects').select('id,name').eq('organization_id','default')
    ]).then(([{data:u},{data:p}])=>{ setUpdates(u||[]); setProjects(p||[]); setLoading(false) })
  },[])

  const filtered = projF ? updates.filter(u=>u.project_name===projF) : updates

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Project Updates</h1>
          <p className="text-slate-500 mt-1">{filtered.length} updates logged</p>
        </div>
        <Link href="/updates/new" className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{background:'#7C3AED'}}>
          + Log Update
        </Link>
      </div>

      <div className="flex gap-3 mb-5">
        <select value={projF} onChange={e=>setProjF(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
          <option value="">All Projects</option>
          {projects.map(p=><option key={p.id} value={p.name}>{p.name}</option>)}
        </select>
        {projF&&<button onClick={()=>setProjF('')} className="text-sm text-slate-500 px-3 py-2 bg-white border border-slate-200 rounded-lg">Clear</button>}
      </div>

      {loading ? <div className="animate-pulse h-48 bg-slate-200 rounded-xl"/> : (
        <div className="space-y-3">
          {filtered.map(u=>(
            <div key={u.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex gap-4">
              <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{background:'#7C3AED'}}/>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-slate-800">{u.title}</div>
                    <div className="text-xs text-violet-600 mt-0.5">{u.project_name||'General'}{u.stage?' — '+u.stage:''}</div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="text-xs text-slate-400">{new Date(u.update_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
                    {u.progress_pct!=null&&(
                      <div className="mt-1">
                        <span className="text-sm font-bold text-violet-600">{u.progress_pct}%</span>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1">
                          <div className="h-full rounded-full" style={{width:`${u.progress_pct}%`,background:'#7C3AED'}}/>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {u.description&&<p className="text-sm text-slate-500 mb-3">{u.description}</p>}
                {u.reported_by&&<div className="text-xs text-slate-400">Reported by: {u.reported_by}</div>}
                <div className="flex justify-end mt-2">
                  <button onClick={async()=>{
                    await sendWhatsApp(`📢 *Project Update*\n\n*${u.title}*\nProject: ${u.project_name||'General'}${u.stage?'\nStage: '+u.stage:''}${u.progress_pct!=null?'\nProgress: '+u.progress_pct+'%':''}\n\n${u.description||''}`)
                    toast.success('Update shared!')
                  }} className="text-xs text-emerald-600 hover:underline">📱 Share Update</button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length===0&&<div className="text-center py-12 text-slate-400">No updates yet. <Link href="/updates/new" className="text-violet-600">Log one →</Link></div>}
        </div>
      )}
    </div>
  )
}
