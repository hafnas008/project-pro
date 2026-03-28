'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '../../../lib/supabase'
import { sendWhatsApp } from '../../../lib/notify'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function NewTask() {
  const router = useRouter()
  const sb = getSupabase()
  const [projects, setProjects] = useState([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({title:'',description:'',project_id:'',project_name:'',status:'todo',priority:'medium',assigned_to:'',due_date:''})
  const set = k => e => setForm(p=>({...p,[k]:e.target.value}))

  useEffect(()=>{ sb.from('pm_projects').select('id,name').eq('organization_id','default').then(({data})=>setProjects(data||[])) },[])

  function handleProjectChange(e) {
    const id = e.target.value
    const proj = projects.find(p=>p.id===id)
    setForm(p=>({...p, project_id:id, project_name:proj?.name||''}))
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Task title required'); return }
    setSaving(true)
    const payload = {
      title:form.title, description:form.description||null,
      project_id:form.project_id||null, project_name:form.project_name||null,
      status:form.status, priority:form.priority,
      assigned_to:form.assigned_to||null, due_date:form.due_date||null,
      organization_id:'default', created_by:'manager'
    }
    const {error} = await sb.from('pm_tasks').insert(payload)
    if (error) { toast.error(error.message); setSaving(false); return }
    await sendWhatsApp(`✅ *New Task Assigned*\n\n*${form.title}*\nProject: ${form.project_name||'General'}\nPriority: ${form.priority}\nStatus: ${form.status.replace('_',' ')}${form.assigned_to?'\nAssigned to: '+form.assigned_to:''}${form.due_date?'\nDue: '+new Date(form.due_date).toLocaleDateString():''}`)
    toast.success('Task created!')
    router.push('/tasks')
  }

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/tasks" className="text-sm text-slate-400 hover:text-slate-600">← Tasks</Link>
        <h1 className="text-2xl font-bold text-slate-800 mt-2">New Task</h1>
      </div>
      <form onSubmit={submit} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Task Title *</label>
          <input value={form.title} onChange={set('title')} className={inputClass} placeholder="e.g. Lay foundation concrete — Block A"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea value={form.description} onChange={set('description')} rows={3} className={inputClass} placeholder="Task details..."/>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
            <select value={form.project_id} onChange={handleProjectChange} className={inputClass}>
              <option value="">No Project</option>
              {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Assigned To</label>
            <input value={form.assigned_to} onChange={set('assigned_to')} className={inputClass} placeholder="Team member name"/>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select value={form.status} onChange={set('status')} className={inputClass}>
              {['todo','in_progress','done','blocked'].map(s=><option key={s} value={s}>{s.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
            <select value={form.priority} onChange={set('priority')} className={inputClass}>
              {['high','medium','low'].map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
            <input type="date" value={form.due_date} onChange={set('due_date')} className={inputClass}/>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="px-6 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{background:'#7C3AED'}}>
            {saving?'Creating...':'Create Task'}
          </button>
          <Link href="/tasks" className="px-6 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
