'use client'
import { useState, useEffect } from 'react'
import { getSupabase } from '../lib/supabase'
import { sendWhatsApp } from '../lib/notify'
import Link from 'next/link'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  active: 'bg-emerald-100 text-emerald-700',
  on_hold: 'bg-amber-100 text-amber-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
  todo: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-violet-100 text-violet-700',
  done: 'bg-emerald-100 text-emerald-700',
  blocked: 'bg-red-100 text-red-700',
}
const PRIORITY_COLORS = { high: 'bg-red-500', medium: 'bg-amber-400', low: 'bg-emerald-400' }

export default function Dashboard() {
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const sb = getSupabase()

  useEffect(() => {
    Promise.all([
      sb.from('pm_projects').select('*').eq('organization_id','default').order('created_at',{ascending:false}),
      sb.from('pm_tasks').select('*').eq('organization_id','default').order('created_at',{ascending:false})
    ]).then(([{data:p},{data:t}]) => {
      setProjects(p||[])
      setTasks(t||[])
      setLoading(false)
    })
  }, [])

  const activeProjects = projects.filter(p=>p.status==='active').length
  const openTasks = tasks.filter(t=>t.status!=='done').length
  const inProgress = tasks.filter(t=>t.status==='in_progress').length
  const doneTasks = tasks.filter(t=>t.status==='done').length

  async function sendTeamUpdate() {
    const msg = `📊 *Project Hub — Team Update*\n\nActive Projects: ${activeProjects}\nOpen Tasks: ${openTasks}\nIn Progress: ${inProgress}\nCompleted: ${doneTasks}\n\nKeep up the great work! 💪`
    await sendWhatsApp(msg)
    toast.success('Team update sent!')
  }

  const getProjectProgress = (proj) => {
    const projTasks = tasks.filter(t => t.project_id === proj.id || t.project_name === proj.name)
    if (!projTasks.length) return 0
    return Math.round(projTasks.filter(t=>t.status==='done').length / projTasks.length * 100)
  }

  if (loading) return (
    <div className="p-8">
      <div className="animate-pulse space-y-4">
        {[...Array(4)].map((_,i)=><div key={i} className="h-24 bg-slate-200 rounded-xl"/>)}
      </div>
    </div>
  )

  const today = new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Good morning 👋</h1>
          <p className="text-slate-500 mt-1">{today} — Here's your project overview</p>
        </div>
        <div className="flex gap-3">
          <button onClick={sendTeamUpdate} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{background:'#7C3AED'}}>
            📱 Send Update
          </button>
          <Link href="/tasks/new" className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-slate-700">
            + New Task
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-8">
        {[
          {label:'Active Projects',value:activeProjects,icon:'🗂️',color:'#7C3AED',bg:'#EDE9FE'},
          {label:'Open Tasks',value:openTasks,icon:'📋',color:'#0EA5E9',bg:'#E0F2FE'},
          {label:'In Progress',value:inProgress,icon:'⚡',color:'#F59E0B',bg:'#FEF3C7'},
          {label:'Completed',value:doneTasks,icon:'✅',color:'#10B981',bg:'#D1FAE5'},
        ].map(s=>(
          <div key={s.label} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-3xl font-bold" style={{color:s.color}}>{s.value}</div>
                <div className="text-sm text-slate-500 mt-1">{s.label}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{background:s.bg}}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-semibold text-slate-800">Project Health</h2>
            <Link href="/projects" className="text-sm text-violet-600 hover:underline">View all →</Link>
          </div>
          <div className="p-5 space-y-4">
            {projects.length === 0 && <p className="text-slate-400 text-sm text-center py-4">No projects yet. <Link href="/projects/new" className="text-violet-600">Create one →</Link></p>}
            {projects.map(p => {
              const pct = getProjectProgress(p)
              const ptasks = tasks.filter(t => t.project_id===p.id || t.project_name===p.name)
              return (
                <div key={p.id}>
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm text-slate-800">{p.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status]||'bg-slate-100 text-slate-600'}`}>{p.status}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{ptasks.filter(t=>t.status==='done').length}/{ptasks.length} tasks</span>
                      <span className="font-semibold text-slate-700">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{width:`${pct}%`,background:pct===100?'#10B981':'#7C3AED'}} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              {label:'New Task', href:'/tasks/new', icon:'✅', color:'bg-violet-50 text-violet-700'},
              {label:'New Project', href:'/projects/new', icon:'🗂️', color:'bg-sky-50 text-sky-700'},
              {label:'Log Update', href:'/updates/new', icon:'📢', color:'bg-amber-50 text-amber-700'},
              {label:'View Kanban', href:'/kanban', icon:'📋', color:'bg-emerald-50 text-emerald-700'},
              {label:'Timeline', href:'/timeline', icon:'📅', color:'bg-rose-50 text-rose-700'},
            ].map(a=>(
              <Link key={a.label} href={a.href} className={`flex items-center gap-3 p-3 rounded-lg ${a.color} hover:opacity-80 transition-opacity text-sm font-medium`}>
                <span>{a.icon}</span>{a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-semibold text-slate-800">Recent Tasks</h2>
          <Link href="/tasks" className="text-sm text-violet-600 hover:underline">View all →</Link>
        </div>
        <div className="divide-y divide-slate-50">
          {tasks.slice(0,8).map(t=>(
            <div key={t.id} className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_COLORS[t.priority]||'bg-slate-300'}`}/>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 truncate">{t.title}</div>
                <div className="text-xs text-slate-400">{t.project_name || 'No project'}{t.assigned_to ? ` · ${t.assigned_to}` : ''}</div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[t.status]||'bg-slate-100 text-slate-600'}`}>{t.status?.replace('_',' ')}</span>
              {t.due_date && <span className="text-xs text-slate-400">{new Date(t.due_date).toLocaleDateString()}</span>}
            </div>
          ))}
          {tasks.length===0 && <p className="text-center text-slate-400 text-sm py-8">No tasks yet. <Link href="/tasks/new" className="text-violet-600">Create one →</Link></p>}
        </div>
      </div>
    </div>
  )
}
