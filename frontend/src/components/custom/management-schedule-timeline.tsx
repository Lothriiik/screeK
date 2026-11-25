import { WarningCircle } from '@phosphor-icons/react';
import type { GanttSession, ScheduleRoom } from '../../types/management-schedule';

const TIME_RULER = ['13h', '14h', '15h', '16h', '17h', '18h', '19h', '20h', '21h', '22h'];

interface ManagementScheduleTimelineProps {
  rooms: ScheduleRoom[];
  sessions: GanttSession[];
  selectedSessionId?: string;
  onSelectSession: (session: GanttSession) => void;
}

export function ManagementScheduleTimeline({
  rooms,
  sessions,
  selectedSessionId,
  onSelectSession,
}: ManagementScheduleTimelineProps) {
  return (
    <main className="flex-1 overflow-x-auto overflow-y-auto bg-background p-4 sm:p-6">
      <div className="min-w-[920px] space-y-4">
        <div className="flex border-b-2 border-foreground/20 pb-2 text-xs font-mono font-bold text-foreground/50">
          <div className="w-56 shrink-0 font-display text-[11px] font-black uppercase text-foreground/60">
            SALA / HORÁRIO →
          </div>
          <div className="relative grid flex-1 grid-cols-10 text-center">
            {TIME_RULER.map((time) => <span key={time}>{time}</span>)}
          </div>
        </div>

        <div className="space-y-3">
          {rooms.map((room) => {
            const roomSessions = sessions.filter((session) => session.roomId === room.id);
            return (
              <div key={room.id} className="flex items-center">
                <div className="flex w-56 shrink-0 items-center justify-between pr-4">
                  <div className="min-w-0 space-y-0.5">
                    <h4 className="truncate text-xs font-black uppercase leading-tight text-foreground">{room.name}</h4>
                    <span className="block truncate font-sans text-[10px] text-foreground/50">{room.type} · {room.seats} lug.</span>
                    <span className={`text-[9px] font-bold uppercase ${room.isMaintenance ? 'text-amber-600' : 'text-[#34A853]'}`}>
                      ● {room.status}
                    </span>
                  </div>
                  <div className="shrink-0 pl-2 text-right">
                    {room.isMaintenance ? (
                      <span className="font-mono text-[11px] text-foreground/40">—</span>
                    ) : (
                      <>
                        <span className="block font-mono text-xs font-black text-foreground">{room.occupancyRate}%</span>
                        <span className="block font-mono text-[9px] text-foreground/50">{room.currentSeats}/{room.seats}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="relative h-16 flex-1 overflow-hidden border border-foreground/20 bg-muted/20">
                  <div className="pointer-events-none absolute inset-0 grid grid-cols-10 divide-x divide-foreground/10" />
                  {room.isMaintenance ? (
                    <div className="absolute inset-1 flex items-center justify-center border border-dashed border-foreground/30 bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.05),rgba(0,0,0,0.05)_10px,transparent_10px,transparent_20px)] font-sans text-xs font-bold text-foreground/50">
                      Manutenção preventiva — Dia inteiro
                    </div>
                  ) : roomSessions.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center font-sans text-[10px] italic text-foreground/40">
                      Nenhuma sessão programada para esta sala na data
                    </div>
                  ) : roomSessions.map((session) => {
                    const leftPct = (session.startMinutes / 540) * 100;
                    const widthPct = (session.durationMinutes / 540) * 100;
                    const isSelected = selectedSessionId === session.id;
                    return (
                      <button
                        key={session.id}
                        type="button"
                        style={{ left: `${Math.max(0, leftPct)}%`, width: `${Math.min(100, widthPct)}%` }}
                        onClick={() => onSelectSession(session)}
                        className={`absolute top-1 bottom-1 flex cursor-pointer flex-col justify-between overflow-hidden border-2 p-2 text-left text-xs transition-all ${isSelected ? 'z-10 border-foreground shadow-[3px_3px_0px_0px_var(--border)]' : session.color}`}
                        aria-label={`${session.movieTitle}, ${session.startTime} até ${session.endTime}, ${session.format} ${session.audio}`}
                      >
                        <span className="flex items-center justify-between gap-1 leading-none">
                          <span className="truncate text-[11px] font-black uppercase">{session.movieTitle}</span>
                          {session.hasConflict && <WarningCircle size={14} weight="fill" className="shrink-0 text-secondary" />}
                        </span>
                        <span className="flex items-center justify-between text-[9px] font-mono leading-none opacity-80">
                          <span>{session.startTime} → {session.endTime}</span>
                          <span className="flex items-center gap-1">
                            <span className="bg-foreground/10 px-1 font-bold">{session.format}</span>
                            <span>{session.audio}</span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
