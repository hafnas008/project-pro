'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '../../../lib/supabase'
import { sendWhatsApp } from '../../../lib/notify'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function NewUpdate() {
  const router = useRouter()
  const sb = getSupabase()
  const [projects, setProjects] = useState([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({project_id:'',project_name:'',title:'',description:'',stage:'',progress_pct:0,reported_by:''})
  const set = k => e => setForm(p=>({...p,[k]:e.target.value}))

  useEffect(()=>{ sb.from('pm_projects').select('id,name').eq('organization_id','default').then(({data})=>setProjects(data||[])) },[])

  function handleProjectChange(e) {
    const id = e.target.value
    const proj = projects.find(p=>p.id===id)
    setForm(p=>({...p,project_id:id,project_name:proj?.name||''}))
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title required'); return }
    setSaving(true)
    const payload = {
      project_id:form.project_id||null, project_name:form.project_name||null,
      title:form.title, description:form.description||null, stage:form.stage||null,
      progress_pct:parseInt(form.progress_pct)||0, reported_by:form.reported_by||null,
      update_date:new Date().toISOString().split('T')[0], organization_id:'default'
    }
    const {error} = await sb.from('pm_updates').insert(payload)
    if (error) { toast.error(error.message); setSaving(false); return }
    await sendWhatsApp(`📢 *Project Update*\n\n*${form.title}*\nProject: ${form.project_name||'General'}${form.stage?'\nStage: '+form.stage:''}\nProgress: ${form.progress_pct}%\n\n${form.description||''}`)
    toast.success('Update logged!')
    router.push('/updates')
  }

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/updates" className="text-sm text-slate-400 hover:text-slate-600">← Updates</Link>
        <h1 className="text-2xl font-bold text-slate-800 mt-2">Log Update</h1>
      </div>
      <form onSubmit={submit} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
            <select value={form.project_id} onChange={handleProjectChange} className={inputClass}>
              <option value="">No Project</option>
              {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Stage</label>
            <input value={form.stage} onChange={set('stage')} className={inputClass} placeholder="e.g. Foundation, Framing"/>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Update Title *</label>
          <input value={form.title} onChange={set('title')} className={inputClass} placeholder="e.g. Foundation work 60% complete"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea value={form.description} onChange={set('description')} rows={4} className={inputClass} placeholder="Detailed update..."/>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Progress: {form.progress_pct}%</label>
            <input type="range" min={0} max={100} value={form.progress_pct} onChange={set('progress_pct')} className="w-full accent-violet-600"/>
            <div className="h-2 bg-slate-100 rounded-full mt-2">
              <div className="h-full rounded-full" style={{width:`${form.progress_pct}%`,background:'#7C3AED'}}/>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reported By</label>
            <input value={form.reported_by} onChange={set('reported_by')} className={inputClass} placeholder="Your name"/>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="px-6 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{background:'#7C3AED'}}>
            {saving?'Saving...':'Log Update'}
          </button>
          <Link href="/updates" className="px-6 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
