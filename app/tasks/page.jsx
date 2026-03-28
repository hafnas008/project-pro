'use client'
import { useState, useEffect, Suspense } from 'react'
import { getSupabase } from '../../lib/supabase'
import { sendWhatsApp } from '../../lib/notify'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

const STATUS_STYLE = {
  todo:'bg-slate-100 text-slate-600',
  in_progress:'bg-violet-100 text-violet-700',
  done:'bg-emerald-100 text-emerald-700',
  blocked:'bg-red-100 text-red-700'
}
const PRI_STYLE = {
  high:'bg-red-100 text-red-700',
  medium:'bg-amber-100 text-amber-700',
  low:'bg-emerald-100 text-emerald-700'
}

function TasksContent() {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusF, setStatusF] = useState('')
  const [priF, setPriF] = useState('')
  const [projF, setProjF] = useState('')
  const [page, setPage] = useState(1)
  const sb = getSupabase()
  const sp = useSearchParams()

  useEffect(() => {
    const projParam = sp.get('project')
    if (projParam) setProjF(projParam)
    Promise.all([
      sb.from('pm_tasks').select('*').eq('organization_id','default').order('created_at',{ascending:false}),
      sb.from('pm_projects').select('id,name').eq('organization_id','default')
    ]).then(([{data:t},{data:p}]) => { setTasks(t||[]); setProjects(p||[]); setLoading(false) })
  }, [])

  const filtered = tasks.filter(t => {
    if (search && !t.title?.toLowerCase().includes(search.toLowerCase()) && !t.assigned_to?.toLowerCase().includes(search.toLowerCase())) return false
    if (statusF && t.status !== statusF) return false
    if (priF && t.priority !== priF) return false
    if (projF && t.project_name !== projF) return false
    return true
  })
  const pages = Math.ceil(filtered.length/20)
  const paged = filtered.slice((page-1)*20, page*20)

  async function updateStatus(id, newStatus) {
    await sb.from('pm_tasks').update({status:newStatus}).eq('id',id)
    setTasks(prev=>prev.map(t=>t.id===id?{...t,status:newStatus}:t))
    toast.success('Updated')
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">All Tasks</h1>
          <p className="text-slate-500 mt-1">{filtered.length} tasks</p>
        </div>
        <Link href="/tasks/new" className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{background:'#7C3AED'}}>+ New Task</Link>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tasks..." className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-violet-300"/>
        <select value={statusF} onChange={e=>setStatusF(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
          <option value="">All Status</option>
          {['todo','in_progress','done','blocked'].map(s=><option key={s} value={s}>{s.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
        </select>
        <select value={priF} onChange={e=>setPriF(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
          <option value="">All Priority</option>
          {['high','medium','low'].map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
        </select>
        <select value={projF} onChange={e=>setProjF(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
          <option value="">All Projects</option>
          {projects.map(p=><option key={p.id} value={p.name}>{p.name}</option>)}
        </select>
        {(search||statusF||priF||projF)&&<button onClick={()=>{setSearch('');setStatusF('');setPriF('');setProjF('');setPage(1)}} className="text-sm text-slate-500 hover:text-slate-700 px-3 py-2 bg-white border border-slate-200 rounded-lg">Clear</button>}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>{['Task','Project','Assignee','Priority','Status','Due Date','Actions'].map(h=>(
              <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-3">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading && <tr><td colSpan={7} className="text-center py-8"><div className="animate-pulse text-slate-400">Loading...</div></td></tr>}
            {!loading && paged.map(t=>(
              <tr key={t.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 text-sm font-medium text-slate-800 max-w-xs truncate">{t.title}</td>
                <td className="px-4 py-3 text-sm text-violet-600">{t.project_name||'—'}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{t.assigned_to||'—'}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRI_STYLE[t.priority]||'bg-slate-100 text-slate-600'}`}>{t.priority||'medium'}</span></td>
                <td className="px-4 py-3">
                  <select value={t.status} onChange={e=>updateStatus(t.id,e.target.value)} className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer ${STATUS_STYLE[t.status]||''}`}>
                    {['todo','in_progress','done','blocked'].map(s=><option key={s} value={s}>{s.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{t.due_date?new Date(t.due_date).toLocaleDateString():'—'}</td>
                <td className="px-4 py-3">
                  <button onClick={async()=>{
                    await sendWhatsApp(`✅ *Task Update*\n\n${t.title}\nProject: ${t.project_name||'General'}\nStatus: ${t.status.replace('_',' ')}\nPriority: ${t.priority||'medium'}${t.due_date?'\nDue: '+new Date(t.due_date).toLocaleDateString():''}`)
                    toast.success('Sent!')
                  }} className="text-xs text-emerald-600 hover:underline">📱 Notify</button>
                </td>
              </tr>
            ))}
            {!loading && paged.length===0 && <tr><td colSpan={7} className="text-center py-12 text-slate-400">No tasks found</td></tr>}
          </tbody>
        </table>
        {pages>1&&(
          <div className="flex justify-center gap-2 p-4 border-t border-slate-100">
            {[...Array(pages)].map((_,i)=>(
              <button key={i} onClick={()=>setPage(i+1)} className={`w-8 h-8 text-sm rounded-lg`} style={page===i+1?{background:'#7C3AED',color:'white'}:{background:'white',border:'1px solid #e2e8f0',color:'#475569'}}>{i+1}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AllTasks() {
  return <Suspense fallback={<div className="p-8 text-slate-400">Loading...</div>}><TasksContent/></Suspense>
}
