'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '../../../lib/supabase'
import { sendWhatsApp } from '../../../lib/notify'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function NewProject() {
  const router = useRouter()
  const sb = getSupabase()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name:'', description:'', status:'active',
    start_date:'', end_date:'', budget:'', currency:'QAR',
    location:'', notes:''
  })
  const set = k => e => setForm(p=>({...p,[k]:e.target.value}))

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Project name required'); return }
    setSaving(true)
    const payload = { ...form, organization_id:'default', created_by:'manager' }
    if (!payload.budget) delete payload.budget
    if (!payload.start_date) delete payload.start_date
    if (!payload.end_date) delete payload.end_date
    const {error} = await sb.from('pm_projects').insert(payload)
    if (error) { toast.error(error.message); setSaving(false); return }
    await sendWhatsApp(`🗂️ *New Project Created*\n\n*${form.name}*\nStatus: Active\n${form.location?'Location: '+form.location+'\n':''}${form.budget?'Budget: QAR '+Number(form.budget).toLocaleString()+'\n':''}\nLet's get started! 💪`)
    toast.success('Project created!')
    router.push('/projects')
  }

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/projects" className="text-sm text-slate-400 hover:text-slate-600">← Projects</Link>
        <h1 className="text-2xl font-bold text-slate-800 mt-2">New Project</h1>
      </div>
      <form onSubmit={submit} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Project Name *</label>
          <input value={form.name} onChange={set('name')} className={inputClass} placeholder="e.g. Villa Construction Phase 2"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea value={form.description} onChange={set('description')} rows={3} className={inputClass} placeholder="Brief project description..."/>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select value={form.status} onChange={set('status')} className={inputClass}>
              {['active','on_hold','completed','cancelled'].map(s=><option key={s} value={s}>{s.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
            <input value={form.location} onChange={set('location')} className={inputClass} placeholder="e.g. Qatar, Doha"/>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
            <input type="date" value={form.start_date} onChange={set('start_date')} className={inputClass}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
            <input type="date" value={form.end_date} onChange={set('end_date')} className={inputClass}/>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Budget</label>
            <input type="number" value={form.budget} onChange={set('budget')} className={inputClass} placeholder="0.00"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
            <select value={form.currency} onChange={set('currency')} className={inputClass}>
              {['QAR','USD','EUR','GBP'].map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea value={form.notes} onChange={set('notes')} rows={2} className={inputClass} placeholder="Additional notes..."/>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="px-6 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{background:'#7C3AED'}}>
            {saving ? 'Creating...' : 'Create Project'}
          </button>
          <Link href="/projects" className="px-6 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
