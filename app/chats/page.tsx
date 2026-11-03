import ChatsInbox from '@/components/ChatsInbox';

export const dynamic = 'force-dynamic';

export default async function ChatsPage() {
  return (
    <div>
      <div className="toolbar">
        <div>
          <div className="phero-kick" style={{ color: 'var(--text-muted)' }}>Bandeja del asistente</div>
          <h2 className="page-title" style={{ marginBottom: 0 }}>Chats</h2>
        </div>
        <span className="live-badge">En vivo</span>
      </div>
      <ChatsInbox />
    </div>
  );
}
