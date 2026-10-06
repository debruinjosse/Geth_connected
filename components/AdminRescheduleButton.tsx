"use client";

import { useState } from "react";
import { updateDemoBookingStatusAction } from "@/app/actions/demoBookings";
import { Button } from "@/components/ui/Button";
import { Field, FieldGrid, Input, Select, Textarea } from "@/components/ui/Fields";
import { Modal } from "@/components/ui/Modal";

export function AdminRescheduleButton({
  bookingId,
  minDate,
  defaults,
  labels
}: {
  bookingId: string;
  minDate: string;
  defaults: { date: string; time: string; duration: string; note: string };
  labels: {
    open: string;
    newDate: string;
    newTime: string;
    duration: string;
    duration30: string;
    duration45: string;
    duration60: string;
    notePlaceholder: string;
    send: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const id = `reschedule-${bookingId}`;

  return (
    <>
      <Button variant="ghost" size="sm" type="button" onClick={() => setOpen(true)}>
        {labels.open}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={labels.open}>
        <form action={updateDemoBookingStatusAction}>
          <input type="hidden" name="bookingId" value={bookingId} />
          <input type="hidden" name="status" value="rescheduled" />
          <FieldGrid>
            <Field label={labels.newDate} htmlFor={`${id}-date`}>
              <Input id={`${id}-date`} name="rescheduleDate" type="date" min={minDate} defaultValue={defaults.date} required />
            </Field>
            <Field label={labels.newTime} htmlFor={`${id}-time`}>
              <Input id={`${id}-time`} name="rescheduleTime" type="time" defaultValue={defaults.time} required />
            </Field>
            <Field label={labels.duration} htmlFor={`${id}-duration`} className="lp-span-2">
              <Select id={`${id}-duration`} name="rescheduleDuration" defaultValue={defaults.duration}>
                <option value="30">{labels.duration30}</option>
                <option value="45">{labels.duration45}</option>
                <option value="60">{labels.duration60}</option>
              </Select>
            </Field>
            <Field className="lp-span-2">
              <Textarea name="adminNote" rows={3} placeholder={labels.notePlaceholder} defaultValue={defaults.note} aria-label={labels.notePlaceholder} />
            </Field>
          </FieldGrid>
          <div className="lp-form-foot">
            <span />
            <Button type="submit">{labels.send}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
