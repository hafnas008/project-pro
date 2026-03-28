'use client'
import { useState, useEffect } from 'react'
import { getSupabase } from '../../lib/supabase'
import { sendWhatsApp } from '../../lib/notify'
import Link from 'next/link'
import toast from 'react-hot-toast'

const COLUMNS = [
  { id:'todo', label:'To Do', color:'#64748B', bg:'#F1F5F9', dot:'bg-slate-400' },
  { id:'in_progress', label:'In Progress', color:'#7C3AED', bg:'#EDE9FE', dot:'bg-violet-500' },
  { id:'done', label:'Done', color:'#10B981', bg:'#D1FAE5', dot:'bg-emerald-500' },
  { id:'blocked', label:'Blocked', color:'#EF4444', bg:'#FEE2E2', dot:'bg-red-500' },
]
const PRIORITY_DOT = { high:'bg-red-500', medium:'bg-amber-400', low:'bg-emerald-400' }
const STATUSES = ['todo','in_progress','done','blocked']

export default function Kanban() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const sb = getSupabase()

  useEffect(() => {
    sb.from('pm_tasks').select('*').eq('organization_id','default').order('created_at',{ascending:false})
      .then(({data}) => { setTasks(data||[]); setLoading(false) })
  }, [])

  async function moveTask(task, direction) {
    const idx = STATUSES.indexOf(task.status)
    const newStatus = STATUSES[idx + direction]
    if (!newStatus) return
    const {error} = await sb.from('pm_tasks').update({status:newStatus}).eq('id',task.id)
    if (!error) {
      setTasks(prev => prev.map(t => t.id===task.id ? {...t,status:newStatus} : t))
      toast.success(`Moved to ${newStatus.replace('_',' ')}`)
    }
  }

  async function notifyAssignee(task) {
    await sendWhatsApp(`📋 *Task Update — Project Hub*\n\nTask: *${task.title}*\nProject: ${task.project_name||'General'}\nStatus: ${task.status.replace('_',' ')}\nPriority: ${task.priority||'medium'}\n${task.due_date?'Due: '+new Date(task.due_date).toLocaleDateString():''}`)
    toast.success('Notification sent!')
  }

  if (loading) return <div className="p-8"><div className="animate-pulse h-64 bg-slate-200 rounded-xl"/></div>

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kanban Board</h1>
          <p className="text-slate-500 mt-1">{tasks.length} tasks across all projects</p>
        </div>
        <Link href="/tasks/new" className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{background:'#7C3AED'}}>
          + Add Task
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t=>t.status===col.id)
          return (
            <div key={col.id} className="rounded-xl" style={{background:col.bg,minHeight:'500px'}}>
              <div className="p-3 flex items-center justify-between rounded-t-xl" style={{background:col.bg}}>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`}/>
                  <span className="text-sm font-semibold" style={{color:col.color}}>{col.label}</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/60" style={{color:col.color}}>{colTasks.length}</span>
              </div>
              <div className="p-2 space-y-2">
                {colTasks.map(task => (
                  <div key={task.id} className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border border-white/60">
                    <div className="flex items-start gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[task.priority]||'bg-slate-300'}`}/>
                      <p className="text-sm font-medium text-slate-800 flex-1 leading-snug">{task.title}</p>
                    </div>
                    {task.project_name && <div className="text-xs text-violet-600 mb-1 font-medium">{task.project_name}</div>}
                    {task.assigned_to && <div className="text-xs text-slate-400 mb-2">👤 {task.assigned_to}</div>}
                    {task.due_date && <div className="text-xs text-slate-400 mb-2">📅 {new Date(task.due_date).toLocaleDateString()}</div>}
                    <div className="flex gap-1 mt-2">
                      <button onClick={()=>moveTask(task,-1)} disabled={STATUSES.indexOf(task.status)===0}
                        className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-30">←</button>
                      <button onClick={()=>moveTask(task,1)} disabled={STATUSES.indexOf(task.status)===STATUSES.length-1}
                        className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-30">→</button>
                      <button onClick={()=>notifyAssignee(task)} className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 ml-auto">📱</button>
                    </div>
                  </div>
                ))}
                <Link href="/tasks/new" className="block text-center text-xs text-slate-400 hover:text-slate-600 py-2 border-2 border-dashed border-slate-200 rounded-lg hover:border-slate-300">
                  + Add task
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
