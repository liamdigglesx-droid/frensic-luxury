import { useEffect, useState } from 'react';
import { Check, Phone } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CAR_BOOKING_PHONE_DISPLAY, CAR_BOOKING_PHONE_TEL, CAR_CALL_THANK_YOU_MESSAGE } from '@/lib/contact';

export default function CarRentalCallDialog({ open, onOpenChange, onReturnHome, returnHomeDelay = 1800 }) {
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (open) setConfirmed(false);
  }, [open]);

  useEffect(() => {
    if (!open || !confirmed) return;
    const timer = window.setTimeout(() => onReturnHome?.(), returnHomeDelay);
    return () => window.clearTimeout(timer);
  }, [open, confirmed, onReturnHome, returnHomeDelay]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border bg-card text-foreground">
        {!confirmed && <>
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Complete Your Car Booking</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Call this number to proceed with your booking: <strong className="text-foreground">{CAR_BOOKING_PHONE_DISPLAY}</strong>.
            </DialogDescription>
          </DialogHeader>
          <a
            href={`tel:${CAR_BOOKING_PHONE_TEL}`}
            className="flex h-14 items-center justify-center gap-2 border border-primary/30 bg-primary/5 text-base font-medium text-primary"
          >
            <Phone size={16} /> {CAR_BOOKING_PHONE_DISPLAY}
          </a>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            Our team will confirm availability and complete your reservation.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href={`tel:${CAR_BOOKING_PHONE_TEL}`}
              className="flex h-12 items-center justify-center gap-2 bg-primary text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground"
            >
              <Phone size={14} /> Call Now
            </a>
            <button
              type="button"
              onClick={() => setConfirmed(true)}
              className="h-12 border border-border text-xs font-medium uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              I have made the call
            </button>
          </div>
        </>}
        {confirmed && <div className="py-8 text-center" role="status">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center border border-primary text-primary"><Check size={26} /></div>
          <DialogTitle className="font-heading text-2xl mb-3">Thank You</DialogTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">{CAR_CALL_THANK_YOU_MESSAGE}</p>
          <button
            type="button"
            onClick={() => onReturnHome?.()}
            className="mt-6 h-12 w-full bg-primary text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground"
          >
            Back to Home
          </button>
        </div>}
      </DialogContent>
    </Dialog>
  );
}
