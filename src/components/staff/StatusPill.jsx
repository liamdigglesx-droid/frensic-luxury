const styles = {
  paid: 'bg-green-500/10 text-green-400',
  failed: 'bg-destructive/10 text-destructive',
  pending: 'bg-yellow-500/10 text-yellow-400',
  confirmed: 'bg-blue-500/10 text-blue-400',
  checked_in: 'bg-purple-500/10 text-purple-400',
  completed: 'bg-green-500/10 text-green-400',
  cancelled: 'bg-destructive/10 text-destructive',
};

export default function StatusPill({ value }) {
  const label = (value || 'pending').replaceAll('_', ' ');
  return <span className={`px-2 py-1 text-[10px] tracking-wider uppercase ${styles[value] || styles.pending}`}>{label}</span>;
}