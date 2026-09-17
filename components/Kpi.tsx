export function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return <div className="card"><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>{hint ? <p className="mt-2 text-sm text-slate-500">{hint}</p> : null}</div>;
}
