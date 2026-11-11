import {Link} from 'react-router-dom';
export function RecordNotFound({title='Record not found',backTo='/org/today',backLabel='Return to workspace'}:{title?:string;backTo?:string;backLabel?:string}){
  return <div className="card p-6 bg-white rounded-xl border border-slate-200 shadow-2xs" role="status"><h1 className="text-xl font-bold text-slate-900 mb-2">{title}</h1><p className="text-sm text-slate-600 mb-4">The requested record is unavailable, outside your current scope, or has been retired. No substitute record has been shown.</p><Link className="btn primary inline-flex items-center justify-center px-4 py-2 rounded-lg font-bold text-sm bg-[#1b5fa7] text-white hover:bg-[#174f89] transition-colors" to={backTo}>{backLabel}</Link></div>;
}

