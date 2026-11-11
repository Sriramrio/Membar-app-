import { useState } from 'react';
import { CheckSquare, Download, Square, UserCheck } from 'lucide-react';
import { useAppDispatch,useAppSelector, useNetworkSlice } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHead,StatusPill,Tip } from '@/features/network/components/NetworkUI';
import { approveAttendanceCorrection,finaliseAttendance,setAttendanceStatus } from '@/features/network/networkSlice';
import type { AttendanceRecord } from '@/features/network/types';
import { exportToCsv } from '@/utils/exportCsv';
import { toast } from '@/components/ui/Toast';

export default function AttendanceAdministrationPage(){
  const dispatch=useAppDispatch();
  const n=useNetworkSlice(['attendance', 'events', 'members'] as const);
  const [eventId,setEventId]=useState(n.events[0]?.id??'');
  const [selectedMemberIds,setSelectedMemberIds]=useState<string[]>([]);
  const event=n.events.find(e=>e.id===eventId);
  const rows=n.attendance.filter(a=>a.eventId===eventId);

  const downloadCsv=()=>{
    if(!rows.length){
      toast.warning('No attendance records to export.');
      return;
    }
    const headers=['Member Name','Member ID','Designation','Chapter','Status','Finalised','Correction Requested'];
    const data=rows.map(r=>{
      const member=n.members.find(m=>m.id===r.memberId);
      return [
        member?.name??'Unknown',
        r.memberId,
        member?.designation??'',
        member?.chapter??'',
        r.status,
        r.finalised?'Yes':'No',
        r.correctionReason??''
      ];
    });
    const safeEventName=(event?.name??'event').toLowerCase().replace(/[^a-z0-9]+/g,'-');
    exportToCsv(`attendance-${safeEventName}-${new Date().toISOString().slice(0,10)}`,headers,data);
    toast.success('Attendance CSV downloaded successfully!', 'Export Completed');
  };

  const markAllPresent = () => {
    const unfinalised = rows.filter(r => !r.finalised);
    if (!unfinalised.length) {
      toast.warning('All attendees for this event are already finalised.');
      return;
    }
    unfinalised.forEach(r => {
      dispatch(setAttendanceStatus({ eventId: r.eventId, memberId: r.memberId, status: 'present' }));
    });
    toast.success(`Marked all ${unfinalised.length} attendees as Present!`, 'Attendance Updated');
  };

  const markSelectedPresent = () => {
    if (!selectedMemberIds.length) return;
    const targetRows = rows.filter(r => selectedMemberIds.includes(r.memberId) && !r.finalised);
    if (!targetRows.length) {
      toast.warning('Selected rows are already finalised.');
      return;
    }
    targetRows.forEach(r => {
      dispatch(setAttendanceStatus({ eventId: r.eventId, memberId: r.memberId, status: 'present' }));
    });
    toast.success(`Marked ${targetRows.length} selected members as Present!`, 'Bulk Attendance');
    setSelectedMemberIds([]);
  };

  const toggleSelectAll = () => {
    if (selectedMemberIds.length === rows.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(rows.map(r => r.memberId));
    }
  };

  const toggleRow = (memberId: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  return <div>
    <PageHead
      title="Attendance Administration"
      description="Register and finalise attendance; Parivar Secretaries can bulk mark attendance or select members with checkboxes."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={downloadCsv} disabled={!rows.length}>
            <Download className="size-4"/>Download CSV
          </Button>
          <Button onClick={markAllPresent} disabled={!rows.length || rows.every(r => r.finalised)}>
            <UserCheck className="size-4"/>Mark All Present
          </Button>
        </div>
      }
    />
    <Card className="mb-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <label className="grid flex-1 gap-1 text-sm font-bold">Event
          <select className="min-h-11 rounded-lg border border-slate-300 bg-white px-3" value={eventId} onChange={e=>{setEventId(e.target.value); setSelectedMemberIds([]);}}>
            {n.events.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {selectedMemberIds.length > 0 && (
            <Button onClick={markSelectedPresent}>
              <UserCheck className="size-4"/>Mark Selected Present ({selectedMemberIds.length})
            </Button>
          )}
          <Button variant="secondary" onClick={downloadCsv} disabled={!rows.length}>
            <Download className="size-4"/>Download CSV
          </Button>
          <Button onClick={()=>dispatch(finaliseAttendance({eventId}))} disabled={!rows.length||rows.every(r=>r.finalised)}>
            Finalise attendance
          </Button>
        </div>
      </div>
    </Card>

    {rows.length > 0 && (
      <div className="mb-3 flex items-center justify-between px-1">
        <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700">
          <input
            type="checkbox"
            className="size-4 rounded-md border-slate-300 text-sky-600 focus:ring-sky-500"
            checked={rows.length > 0 && selectedMemberIds.length === rows.length}
            onChange={toggleSelectAll}
          />
          <span>Select All ({selectedMemberIds.length}/{rows.length} selected)</span>
        </label>
        <Button variant="ghost" onClick={markAllPresent} disabled={rows.every(r => r.finalised)} className="text-sm font-bold text-sky-700">
          Mark All Present
        </Button>
      </div>
    )}

    <div className="grid gap-3">
      {rows.map(r=>{
        const member=n.members.find(m=>m.id===r.memberId);
        const isSelected = selectedMemberIds.includes(r.memberId);
        return (
          <Card key={r.id} className={isSelected ? 'border-sky-300 bg-sky-50/30' : ''}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <input
                  type="checkbox"
                  aria-label={`Select ${member?.name ?? r.memberId}`}
                  className="size-5 rounded-md border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer shrink-0"
                  checked={isSelected}
                  onChange={()=>toggleRow(r.memberId)}
                />
                <div className="min-w-0 flex-1">
                  <h2 className="font-black text-slate-900">{member?.name??r.memberId}</h2>
                  <p className="mt-0.5 text-sm text-slate-600">{member?.designation} · {member?.chapter}</p>
                  {r.correctionReason&&<p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-900">Correction requested: {r.correctionReason}</p>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone={r.status==='present'?'good':r.status==='absent'?'bad':'info'}>{r.status}</StatusPill>
                {r.finalised&&<StatusPill>finalised</StatusPill>}
                {!r.finalised&&(
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant={r.status==='present'?'default':'secondary'}
                      onClick={()=>dispatch(setAttendanceStatus({eventId:r.eventId,memberId:r.memberId,status:'present'}))}
                    >
                      Present
                    </Button>
                    <select
                      aria-label={`Attendance status for ${member?.name??r.memberId}`}
                      className="min-h-10 rounded-lg border border-slate-300 bg-white px-2 text-sm font-semibold"
                      value={r.status}
                      onChange={e=>dispatch(setAttendanceStatus({eventId:r.eventId,memberId:r.memberId,status:e.target.value as AttendanceRecord['status']}))}
                    >
                      {['registered','present','absent','excused'].map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
                {r.correctionStatus==='requested'&&(
                  <>
                    <Button onClick={()=>dispatch(approveAttendanceCorrection({eventId:r.eventId,memberId:r.memberId,status:'present'}))}>Approve present</Button>
                    <Button variant="secondary" onClick={()=>dispatch(approveAttendanceCorrection({eventId:r.eventId,memberId:r.memberId,status:'absent'}))}>Approve absent</Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        );
      })}
      {event&&rows.length===0&&<Card><p className="text-sm text-slate-600">No attendance rows exist yet for {event.name}. Registrations create rows automatically.</p></Card>}
    </div>
    <div className="mt-5"><Tip>Finalisation blocks direct editing in this screen. Corrections preserve the prior status and approval state for audit/reconciliation.</Tip></div>
  </div>;
}

