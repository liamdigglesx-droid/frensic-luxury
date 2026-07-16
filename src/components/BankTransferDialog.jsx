import { useEffect, useState } from 'react';
import { Check, Copy, Loader2, Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export default function BankTransferDialog({ open, onOpenChange, booking, total, onPrepareBooking }) {
  const [seconds, setSeconds] = useState(1200);
  const [step, setStep] = useState('account');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setSeconds(1200);
    setStep('account');
    setFile(null);
    setError('');
  }, [open]);

  useEffect(() => {
    if (!open || step === 'success') return;
    if (seconds <= 0) {
      if (booking?.id) base44.entities.Booking.update(booking.id, { transfer_status: 'expired' }).catch(() => {});
      onOpenChange(false);
      return;
    }
    const timer = window.setTimeout(() => setSeconds(value => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [open, seconds, step, booking?.id, onOpenChange]);

  const continueToReceipt = async () => {
    setUploading(true);
    setError('');
    try {
      if (!booking?.id) await onPrepareBooking();
      setStep('receipt');
    } catch (err) {
      setError(err.message || 'Could not start bank transfer. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const uploadReceipt = async () => {
    if (!file || !booking?.id) return;
    if (file.size > MAX_FILE_SIZE) return setError('Receipt must be 50MB or smaller.');
    setUploading(true);
    setError('');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const receiptSubmittedAt = new Date().toISOString();
      const updated = await base44.entities.Booking.update(booking.id, {
        payment_receipt_url: file_url,
        receipt_submitted_at: receiptSubmittedAt,
        transfer_status: 'receipt_submitted',
      });
      await base44.functions.invoke('sendBookingConfirmation', {
        booking: { ...booking, ...updated, payment_receipt_url: file_url, receipt_submitted_at: receiptSubmittedAt },
        notificationType: 'receipt_submitted',
      }).catch(() => {});
      setStep('success');
    } catch (err) {
      setError(err.message || 'Receipt upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const remainingSeconds = String(seconds % 60).padStart(2, '0');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border bg-card text-foreground">
        {step === 'account' && <>
          <DialogHeader><DialogTitle className="font-heading text-2xl">Pay by Bank Transfer</DialogTitle></DialogHeader>
          <div className="border border-border bg-background p-5 space-y-3 text-sm">
            <p className="flex justify-between"><span className="text-muted-foreground">Bank</span><strong>TAJBank</strong></p>
            <p className="flex justify-between"><span className="text-muted-foreground">Account Number</span><strong>0012903444</strong></p>
            <p className="flex justify-between gap-4"><span className="text-muted-foreground">Account Name</span><strong className="text-right">Frensic Luxury Apartment</strong></p>
            <p className="flex justify-between"><span className="text-muted-foreground">Amount</span><strong className="text-primary">₦{Number(total || 0).toLocaleString()}</strong></p>
          </div>
          <button onClick={() => navigator.clipboard.writeText('0012903444')} className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-primary"><Copy size={14} /> Copy Account Number</button>
          <p className="text-center text-sm text-muted-foreground">Complete your transfer within <strong className="text-primary">{minutes}:{remainingSeconds}</strong></p>
          <p className="border border-primary/20 bg-primary/5 p-3 text-center text-sm text-foreground">Kindly screenshot your receipt after payment for submission.</p>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <button onClick={continueToReceipt} disabled={uploading} className="h-12 bg-primary text-primary-foreground disabled:opacity-40 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.18em]">
            {uploading ? <><Loader2 size={16} className="animate-spin" /> Preparing</> : 'I Have Made Payment'}
          </button>
        </>}

        {step === 'receipt' && <>
          <DialogHeader><DialogTitle className="font-heading text-2xl">Upload Payment Receipt</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Upload an image or PDF receipt. Maximum file size is 50MB.</p>
          <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-3 border border-dashed border-border bg-background p-5 text-center">
            <Upload size={22} className="text-primary" />
            <span className="text-sm text-muted-foreground">{file ? file.name : 'Choose payment receipt'}</span>
            <input type="file" accept="image/*,.pdf,application/pdf" className="hidden" onChange={e => { setFile(e.target.files?.[0] || null); setError(''); }} />
          </label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <p className="text-center text-xs text-muted-foreground">Time remaining: {minutes}:{remainingSeconds}</p>
          <button onClick={uploadReceipt} disabled={!file || uploading} className="h-12 bg-primary text-primary-foreground disabled:opacity-40 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.18em]">
            {uploading ? <><Loader2 size={16} className="animate-spin" /> Uploading</> : 'Submit Receipt'}
          </button>
        </>}

        {step === 'success' && <div className="py-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center border border-primary text-primary"><Check size={26} /></div>
          <DialogTitle className="font-heading text-2xl mb-3">Receipt Uploaded</DialogTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">Wonderful, kindly hold on as our representative will reach you soon.</p>
        </div>}
      </DialogContent>
    </Dialog>
  );
}