'use client'
import { useState, useEffect } from 'react'
import { getSupabase } from '../../lib/supabase'
import { sendWhatsApp } from '../../lib/notify'
import toast from 'react-hot-toast'

export default function Activity() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const sb = getSupabase()

  useEffect(()=>{
    Promise.all([
      sb.from('pm_tasks').select('id,title,project_name,status,priority,assigned_to,created_at').eq('organization_id','default').order('created_at',{ascending:false}).limit(30),
      sb.from('pm_updates').select('id,title,project_name,stage,progress_pct,created_at').eq('organization_id','default').order('created_at',{ascending:false}).limit(20),
    ]).then(([{data:t},{data:u}])=>{
      const taskItems = (t||[]).map(x=>({...x,type:'task'}))
      const updateItems = (u||[]).map(x=>({...x,type:'update'}))
      const all = [...taskItems,...updateItems].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))
      setItems(all)
      setLoading(false)
    })
  },[])

  // Group by date
  const grouped = items.reduce((acc,item)=>{
    const date = new Date(item.created_at).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})
    if (!acc[date]) acc[date] = []
    acc[date].push(item)
    return acc
  },{})

  const STATUS_COLOR = {todo:'text-slate-500',in_progress:'text-violet-600',done:'text-emerald-600',blocked:'text-red-500'}

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Activity Log</h1>
          <p className="text-slate-500 mt-1">{items.length} recent activities</p>
        </div>
        <button onClick={async()=>{
          const taskCount = items.filter(i=>i.type==='task').length
          const updateCount = items.filter(i=>i.type==='update').length
          await sendWhatsApp(`🕐 *Activity Summary — Project Hub*\n\nRecent tasks created: ${taskCount}\nProgress updates logged: ${updateCount}\n\nKeep the momentum going! 💪`)
          toast.success('Summary sent!')
        }} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{background:'#7C3AED'}}>
          📱 Send Summary
        </button>
      </div>

      {loading ? <div className="animate-pulse space-y-4">{[...Array(5)].map((_,i)=><div key={i} className="h-16 bg-slate-200 rounded-xl"/>)}</div> : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date,dayItems])=>(
            <div key={date}>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{date}</div>
              <div className="space-y-2">
                {dayItems.map(item=>(
                  <div key={item.id+item.type} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${item.type==='task'?'bg-violet-50':'bg-amber-50'}`}>
                      {item.type==='task'?'✅':'📢'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">{item.title}</div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-slate-400">{item.project_name||'General'}</span>
                        {item.type==='task' && item.status && (
                          <span className={`text-xs font-medium ${STATUS_COLOR[item.status]||'text-slate-500'}`}>{item.status.replace('_',' ')}</span>
                        )}
                        {item.type==='update' && item.progress_pct!=null && (
                          <span className="text-xs font-medium text-violet-600">{item.progress_pct}%</span>
                        )}
                        {item.assigned_to && <span className="text-xs text-slate-400">→ {item.assigned_to}</span>}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 flex-shrink-0">
                      {new Date(item.created_at).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {items.length===0&&<p className="text-center py-12 text-slate-400">No activity yet.</p>}
        </div>
      )}
    </div>
  )
}
