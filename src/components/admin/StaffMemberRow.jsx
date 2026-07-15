import { useState } from 'react';
import { KeyRound, Trash2 } from 'lucide-react';

export default function StaffMemberRow({ member, busy, onRoleChange, onReset, onDelete }) {
  const [role, setRole] = useState(member.role || 'user');
  const changeRole = (nextRole) => { setRole(nextRole); onRoleChange(member, nextRole); };
  return <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center">
    <div className="flex-1 min-w-0">
      <div className="text-sm text-foreground">{member.role === 'admin' ? 'Admin' : (member.full_name || 'Staff member')}</div>
      <div className="text-xs text-muted-foreground truncate">{member.role === 'admin' ? 'frensicluxuryapartment@gmail.com' : member.email}</div>
    </div>
    <select value={role} disabled={busy} onChange={(e) => changeRole(e.target.value)} className="h-9 border border-input bg-card px-3 text-xs text-foreground">
      <option value="user">Staff</option><option value="admin">Admin</option>
    </select>
    {member.role !== 'admin' && <>
      <button disabled={busy} onClick={() => onReset(member)} className="flex h-9 items-center justify-center gap-2 border border-primary/30 px-3 text-xs text-primary disabled:opacity-50">
        <KeyRound size={13} /> Reset Password
      </button>
      <button disabled={busy} onClick={() => onDelete(member)} className="flex h-9 items-center justify-center gap-2 border border-destructive/30 px-3 text-xs text-destructive disabled:opacity-50">
        <Trash2 size={13} /> Delete
      </button>
    </>}
  </div>;
}