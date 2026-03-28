'use client'
import { useState, useEffect } from 'react'
import { getSupabase } from '../../lib/supabase'
import { sendWhatsApp } from '../../lib/notify'
import toast from 'react-hot-toast'

export default function Reports() {
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const sb = getSupabase()

  useEffect(()=>{
    Promise.all([
      sb.from('pm_projects').select('*').eq('organization_id','default'),
      sb.from('pm_tasks').select('*').eq('organization_id','default').order('created_at',{ascending:false})
    ]).then(([{data:p},{data:t}])=>{ setProjects(p||[]); setTasks(t||[]); setLoading(false) })
  },[])

  const completionRate = tasks.length ? Math.round(tasks.filter(t=>t.status==='done').length/tasks.length*100) : 0
  const overdue = tasks.filter(t=>t.due_date&&new Date(t.due_date)<new Date()&&t.status!=='done').length

  const statusCounts = ['todo','in_progress','done','blocked'].reduce((acc,s)=>({...acc,[s]:tasks.filter(t=>t.status===s).length}),{})
  const priCounts = ['high','medium','low'].reduce((acc,p)=>({...acc,[p]:tasks.filter(t=>t.priority===p).length}),{})

  const getProgress = (proj) => {
    const pt = tasks.filter(t=>t.project_id===proj.id||t.project_name===proj.name)
    if (!pt.length) return {pct:0,done:0,total:0}
    const done = pt.filter(t=>t.status==='done').length
    return {pct:Math.round(done/pt.length*100),done,total:pt.length}
  }

  const BAR_COLORS = {todo:'#94A3B8',in_progress:'#7C3AED',done:'#10B981',blocked:'#EF4444'}
  const PRI_COLORS = {high:'#EF4444',medium:'#F59E0B',low:'#10B981'}

  async function sendReport() {
    const msg = `📈 *Project Hub — Weekly Report*\n\nTotal Projects: ${projects.length}\nActive: ${projects.filter(p=>p.status==='active').length}\n\nTask Summary:\n• Total: ${tasks.length}\n• Done: ${statusCounts.done}\n• In Progress: ${statusCounts.in_progress}\n• Blocked: ${statusCounts.blocked}\n• Overdue: ${overdue}\n\nCompletion Rate: ${completionRate}%\n\n${projects.slice(0,3).map(p=>{ const {pct}=getProgress(p); return `• ${p.name}: ${pct}%` }).join('\n')}`
    await sendWhatsApp(msg)
    toast.success('Report sent!')
  }

  if (loading) return <div className="p-8"><div className="animate-pulse h-64 bg-slate-200 rounded-xl"/></div>

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
          <p className="text-slate-500 mt-1">Project & task analytics</p>
        </div>
        <button onClick={sendReport} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{background:'#7C3AED'}}>
          📱 Send Report
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {[
          {label:'Total Projects',value:projects.length,color:'#7C3AED'},
          {label:'Total Tasks',value:tasks.length,color:'#0EA5E9'},
          {label:'Completion Rate',value:`${completionRate}%`,color:'#10B981'},
          {label:'Overdue Tasks',value:overdue,color:'#EF4444'},
        ].map(s=>(
          <div key={s.label} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
            <div className="text-3xl font-bold mb-1" style={{color:s.color}}>{s.value}</div>
            <div className="text-sm text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Tasks by Status */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Tasks by Status</h2>
          <div className="space-y-3">
            {Object.entries(statusCounts).map(([status,count])=>(
              <div key={status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 capitalize">{status.replace('_',' ')}</span>
                  <span className="font-semibold text-slate-800">{count}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full">
                  <div className="h-full rounded-full" style={{width:tasks.length?`${count/tasks.length*100}%`:'0%',background:BAR_COLORS[status]}}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks by Priority */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Tasks by Priority</h2>
          <div className="space-y-3">
            {Object.entries(priCounts).map(([pri,count])=>(
              <div key={pri}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 capitalize">{pri}</span>
                  <span className="font-semibold text-slate-800">{count}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full">
                  <div className="h-full rounded-full" style={{width:tasks.length?`${count/tasks.length*100}%`:'0%',background:PRI_COLORS[pri]}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Project Progress Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Project Progress</h2>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Project','Status','Tasks Done','Progress','Budget'].map(h=>(
                <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {projects.map(p=>{
              const {pct,done,total} = getProgress(p)
              return (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{p.name}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{p.status}</span></td>
                  <td className="px-4 py-3 text-sm text-slate-600">{done}/{total}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full">
                        <div className="h-full rounded-full" style={{width:`${pct}%`,background:'#7C3AED'}}/>
                      </div>
                      <span className="text-xs font-medium text-slate-700">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{p.budget?`QAR ${Number(p.budget).toLocaleString()}`:'—'}</td>
                </tr>
              )
            })}
            {projects.length===0&&<tr><td colSpan={5} className="text-center py-8 text-slate-400">No projects</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
