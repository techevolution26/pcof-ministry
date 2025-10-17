'use client'
import React, { useEffect, useState } from 'react'
import { createDepartment, updateDepartment, fetchDepartmentById, fetchChurchesList } from '@/lib/adminApi'
import { useRouter } from 'next/navigation'

export default function DepartmentForm({ departmentId }: { departmentId?: string|number }) {
  const router = useRouter()
  const [form, setForm] = useState({ name:'', slug:'', description:'', church_id: '' })
  const [loading,setLoading]=useState(Boolean(departmentId))
  const [churches,setChurches]=useState<unknown[]>([])

  useEffect(()=>{ let mounted=true; (async()=>{ try{ const ch = await fetchChurchesList(); if(!mounted) return; setChurches(ch); }catch{} })(); return ()=>{ mounted=false } },[])

  useEffect(()=>{ if(!departmentId){ setLoading(false); return } let mounted=true; (async()=>{ try{ const b = await fetchDepartmentById(departmentId!); const d = b?.data ?? b; if(!mounted) return; setForm({ name: d.name||'', slug: d.slug||'', description: d.description||'', church_id: d.church_id||'' }) }catch(e){console.error(e)} finally{ if(mounted) setLoading(false) } })(); return ()=>{ mounted=false } },[departmentId])

  async function submit(e:React.FormEvent){
    e.preventDefault()
    try{
      if(departmentId) await updateDepartment(departmentId, form)
      else await createDepartment(form)
      router.push('/admin/departments')
    }catch(err){ alert(err?.message||'Save failed') }
  }

  if(loading) return <div>Loading…</div>

  return (
    <form onSubmit={submit} className="bg-white p-6 rounded shadow space-y-4">
      <div><label className="block text-sm font-medium">Name</label>
        <input name="name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} required className="w-full p-2 border rounded" /></div>

      <div><label className="block text-sm font-medium">Church (optional)</label>
        <select name="church_id" value={form.church_id ?? ''} onChange={(e)=>setForm({...form,church_id:e.target.value})} className="w-full p-2 border rounded">
          <option value="">— global —</option>
          {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div><label className="block text-sm font-medium">Description</label>
        <textarea value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} className="w-full p-2 border rounded" /></div>

      <div className="flex justify-end"><button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded">Save</button></div>
    </form>
  )
}
