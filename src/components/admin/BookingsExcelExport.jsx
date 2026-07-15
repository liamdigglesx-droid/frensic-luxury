import { Download } from 'lucide-react';

const columns = [
  ['Customer', 'guest_name'], ['Email', 'guest_email'], ['Phone', 'guest_phone'],
  ['Type', 'booking_type'], ['Room / Car', 'item_name'], ['Check-in / Pick-up', 'start_date'],
  ['Check-out / Return', 'end_date'], ['Guests', 'guests_count'], ['Duration', 'nights_or_days'],
  ['Unit Price', 'unit_price'], ['Total Amount', 'total_amount'], ['Booking Status', 'booking_status'],
  ['Payment Status', 'payment_status'], ['Payment Method', 'payment_method'], ['Reference', 'payment_reference'],
  ['Transfer Status', 'transfer_status'], ['Receipt URL', 'payment_receipt_url'], ['Booked On', 'created_date'],
];

const clean = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

export default function BookingsExcelExport({ bookings }) {
  const download = () => {
    const rows = [columns.map(([label]) => clean(label)).join(','), ...bookings.map(booking => columns.map(([, field]) => clean(booking[field])).join(','))];
    const blob = new Blob(['\uFEFF', rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `frensic-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return <button onClick={download} disabled={!bookings.length} className="flex h-10 items-center gap-2 border border-primary/30 px-4 text-xs uppercase tracking-wider text-primary disabled:opacity-40">
    <Download size={14} /> Download Excel Report
  </button>;
}