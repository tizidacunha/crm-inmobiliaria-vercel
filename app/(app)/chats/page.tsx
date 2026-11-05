import ChatsInbox from '@/components/ChatsInbox';
import LiveBadge from '@/components/LiveBadge';

export const dynamic = 'force-dynamic';

export default async function ChatsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Bandeja del asistente</div>
          <h2 className="font-display text-[28px] font-bold tracking-[-0.02em]">Chats</h2>
        </div>
        <LiveBadge />
      </div>
      <ChatsInbox />
    </div>
  );
}
