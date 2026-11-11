import { Navigate } from 'react-router-dom';
import { screenById } from '@/config/screenCatalog';
import { ProfessionalSurface } from '../components/professional/ProfessionalSurface';
export default function ScreenPrototypePage({screenId}:{screenId:number}){const screen=screenById.get(screenId);if(!screen)return <Navigate to="/" replace/>;return <div className="mx-auto w-full min-w-0 max-w-[96rem]"><header className="mb-6 border-b border-slate-200 pb-5"><h1 className="text-2xl font-black tracking-tight text-[var(--navy-950)] md:text-[28px]">{screen.title}</h1><p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600">{screen.purpose}</p></header><ProfessionalSurface screen={screen}/></div>}
