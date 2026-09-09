'use client';
import { useState } from 'react';
import { apiRequest } from '@/lib/api';

const headers = ['Name','Roll No','Email','Mobile number','Department','Year','Section','Password'];
type Student = {name:string;rollNo:string;email:string;mobileNumber:string;department:string;year:number;section:string;password:string};
type Result = {email:string;status:'created'|'already_imported'|'failed';message?:string};
function csv(text:string) {
  const rows:string[][]=[];let row:string[]=[],value='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(value);value='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);if(row.some(s=>s.trim()))rows.push(row);row=[];value='';}else value+=c;}
  if(quoted)throw Error('Unclosed CSV quote.');row.push(value);if(row.some(s=>s.trim()))rows.push(row);return rows;
}
function parse(text:string):Student[]{
  const table=csv(text.replace(/^\uFEFF/,''));if(table.length<2)throw Error('Add student rows below the headings.');
  if(table[0].length!==8||headers.some((h,i)=>h.toLowerCase()!==table[0][i].trim().toLowerCase()))throw Error('Use the exact downloaded template headings.');
  if(table.length>1001)throw Error('Upload at most 1000 students.');const emails=new Set(),rolls=new Set();
  return table.slice(1).map((r,i)=>{const n=i+2;if(r.length!==8||r.some(s=>!s.trim()))throw Error(`Row ${n}: all eight fields are required.`);const email=r[2].trim().toLowerCase(),roll=r[1].trim(),year=Number(r[5]);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error(`Row ${n}: invalid email.`);
    if(!Number.isInteger(year)||year<1||year>6)throw Error(`Row ${n}: year must be 1–6.`);
    if([...r[7]].length<12||new TextEncoder().encode(r[7]).length>72)throw Error(`Row ${n}: password must contain at least 12 characters and at most 72 bytes.`);
    if(emails.has(email)||rolls.has(roll.toLowerCase()))throw Error(`Row ${n}: duplicate email or roll number.`);emails.add(email);rolls.add(roll.toLowerCase());
    return {name:r[0].trim(),rollNo:roll,email,mobileNumber:r[3].trim(),department:r[4].trim(),year,section:r[6].trim(),password:r[7]};});
}
export function StudentAccountImportDialog({onClose,onImported}:{onClose:()=>void;onImported:(message:string)=>void}){
  const [rows,setRows]=useState<Student[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[results,setResults]=useState<Result[]>([]),[done,setDone]=useState(false),[confirmed,setConfirmed]=useState(false);
  function download(){const url=URL.createObjectURL(new Blob([headers.join(',')+'\r\n'],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='student-accounts-template.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  async function choose(file?:File){if(!file)return;try{if(file.size>5*1024*1024)throw Error('Choose a file smaller than 5 MB.');setRows(parse(await file.text()));setError('');setResults([]);setDone(false);setConfirmed(false);}catch(e){setRows([]);setError(e instanceof Error?e.message:'Cannot read file.');}}
  async function run(){setBusy(true);setError('');const completed:Result[]=[];try{for(let i=0;i<rows.length;i+=25){const response=await apiRequest<{data:{results:Result[]}}>('/v1/student-master/accounts/import',{method:'POST',body:JSON.stringify({rows:rows.slice(i,i+25)}),timeoutMs:120000});completed.push(...response.data.results);setResults([...completed]);}setDone(true);onImported(`${completed.filter(r=>r.status==='created').length} accounts created; ${completed.filter(r=>r.status==='failed').length} failed`);}catch(e){setError(`Stopped after ${completed.length} rows. Retry the same file safely. ${e instanceof Error?e.message:''}`);}finally{setBusy(false);}}
  const button='rounded-lg border border-[var(--crm-border)] px-4 py-2 text-sm disabled:opacity-40';
  return <div className="fixed inset-0 z-[350] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="student-import-title"><section className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-xl bg-[var(--crm-card)] p-6 text-[var(--crm-text)]">
    <header className="flex items-center justify-between"><h2 id="student-import-title" className="text-xl font-semibold">Bulk create student accounts</h2><button disabled={busy} className={button} onClick={onClose}>Close</button></header>
    <p className="my-4 text-sm leading-6">Download the template and enter one student per row. Use <strong>Year = 1</strong> for the new first-year batch. Use existing department codes and section names. In Excel, keep roll numbers and mobile numbers as text, then save as CSV.</p>
    <p className="mb-4 text-sm">Each row creates a Student login and linked student record. Existing accounts are never overwritten. Use a unique password of at least 12 characters per student. Keep the file private. Photos can be added later by the student or through the admin student directory.</p>
    <div className="flex flex-wrap gap-3"><button className={button} disabled={busy} onClick={download}>Download template</button><label className={button}>Choose CSV<input aria-label="Choose student CSV" disabled={busy} type="file" accept=".csv" className="block max-w-full text-xs" onChange={e=>void choose(e.target.files?.[0])}/></label></div>
    {error&&<p role="alert" className="my-4 text-sm text-red-600">{error}</p>}
    {rows.length>0&&<><p className="my-4 text-sm">{rows.length} students · preview (passwords hidden)</p><ul className="divide-y divide-[var(--crm-border)]">{rows.slice(0,10).map(r=><li key={r.email} className="py-2 text-sm"><strong>{r.name}</strong> · {r.rollNo}<br/>{r.email} · {r.department} · Year {r.year} · {r.section}</li>)}</ul><label className="my-4 flex gap-2 text-sm"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e=>setConfirmed(e.target.checked)}/>I checked this list and want to create these student accounts.</label><button className={button} disabled={busy||done||!confirmed} onClick={()=>void run()}>{busy?`Processing ${results.length} / ${rows.length}…`:'Create accounts'}</button></>}
    {results.length>0&&<div className="mt-4 text-sm" aria-live="polite"><p>{results.filter(r=>r.status==='created').length} created · {results.filter(r=>r.status==='already_imported').length} already imported · {results.filter(r=>r.status==='failed').length} failed</p>{results.filter(r=>r.status==='failed').map(r=><p className="mt-2" key={r.email}>{r.email}: {r.message}</p>)}</div>}
  </section></div>;
}
