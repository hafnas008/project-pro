'use client'
import { useState, useEffect } from 'react'
import { getSupabase } from '../../lib/supabase'
import { sendWhatsApp } from '../../lib/notify'
import Link from 'next/link'
import toast from 'react-hot-toast'

const TEAM = [
  { id:1, name:'Ahmad Al-Rashid', role:'Project Manager', color:'#7C3AED' },
  { id:2, name:'Khalid Ibrahim', role:'Site Engineer', color:'#0EA5E9' },
  { id:3, name:'Mohammed Saeed', role:'Supervisor', color:'#10B981' },
  { id:4, name:'Ali Hassan', role:'Foreman', color:'#F59E0B' },
  { id:5, name:'Fatima Al-Qasim', role:'Safety Officer', color:'#EF4444' },
]

export default function Team() {
  const [tasks, setTasks] = useState([])
  const sb = getSupabase()
  useEffect(()=>{ sb.from('pm_tasks').select('assigned_to,status').eq('organization_id','default').then(({data})=>setTasks(data||[])) },[])

  const getTaskCount = (name) => tasks.filter(t=>t.assigned_to===name&&t.status!=='done').length
  const getDoneCount = (name) => tasks.filter(t=>t.assigned_to===name&&t.status==='done').length

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Team</h1>
          <p className="text-slate-500 mt-1">{TEAM.length} team members</p>
        </div>
        <button onClick={async()=>{
          await sendWhatsApp(`👥 *Team Update — Project Hub*\n\nActive team members: ${TEAM.length}\nTotal open tasks: ${tasks.filter(t=>t.status!=='done').length}\n\nKeep up the great work! 💪`)
          toast.success('Team message sent!')
        }} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{background:'#7C3AED'}}>
          📱 Message Team
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-8">
        {[
          {label:'Team Members',value:TEAM.length,color:'#7C3AED'},
          {label:'Open Tasks',value:tasks.filter(t=>t.status!=='done').length,color:'#0EA5E9'},
          {label:'Completed Tasks',value:tasks.filter(t=>t.status==='done').length,color:'#10B981'},
        ].map(s=>(
          <div key={s.label} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
            <div className="text-3xl font-bold mb-1" style={{color:s.color}}>{s.value}</div>
            <div className="text-sm text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {TEAM.map(m=>{
          const open = getTaskCount(m.name)
          const done = getDoneCount(m.name)
          const initials = m.name.split(' ').map(n=>n[0]).join('').slice(0,2)
          return (
            <div key={m.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{background:m.color}}>
                  {initials}
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{m.name}</div>
                  <div className="text-sm text-slate-500">{m.role}</div>
                </div>
              </div>
              <div className="flex gap-4 text-sm mb-4">
                <div>
                  <div className="text-lg font-bold" style={{color:m.color}}>{open}</div>
                  <div className="text-xs text-slate-400">Open</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-emerald-600">{done}</div>
                  <div className="text-xs text-slate-400">Done</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/tasks/new`} className="flex-1 text-center text-xs py-2 rounded-lg bg-violet-50 text-violet-700 font-medium hover:bg-violet-100">
                  Assign Task
                </Link>
                <button onClick={async()=>{
                  await sendWhatsApp(`Hi ${m.name.split(' ')[0]}! 👋\n\nChecking in on your tasks. You have ${open} open task(s) in Project Hub.\n\nLet me know if you need support! 💪`)
                  toast.success('Message sent!')
                }} className="flex-1 text-xs py-2 rounded-lg bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100">
                  📱 Message
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
