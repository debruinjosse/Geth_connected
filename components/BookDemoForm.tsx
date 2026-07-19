"use client";

import { useActionState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { createDemoBookingAction, type DemoBookingState } from "@/app/actions/demoBookings";

const defaultDemoMessage = [
  "Hi GETH Team,",
  "We're interested in your concept and would like to schedule a demo. Please contact us to arrange a convenient time."
].join("\n");

const initialState: DemoBookingState = {
  ok: false,
  message: ""
};

export function BookDemoForm() {
  const [state, formAction, pending] = useActionState(createDemoBookingAction, initialState);

  if (state.ok) {
    return (
      <div className="panel form-success-panel">
        <CheckCircle2 size={54} color="var(--theme-emerald)" />
        <h2>Demo request received</h2>
        <p>{state.message}</p>
      </div>
    );
  }

  return (
    <form className="panel demo-form-panel" action={formAction}>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="demo-name">Name</label>
          <input id="demo-name" name="name" className="input" placeholder="Sarah van den Berg" autoComplete="name" required />
        </div>
        <div className="form-field">
          <label htmlFor="demo-email">Work email</label>
          <input id="demo-email" name="email" className="input" type="email" placeholder="sarah@company.com" autoComplete="email" required />
        </div>
        <div className="form-field">
          <label htmlFor="demo-company">Company</label>
          <input id="demo-company" name="company" className="input" placeholder="ABC Company" autoComplete="organization" required />
        </div>
        <div className="form-field">
          <label htmlFor="demo-team-size">Team size</label>
          <select id="demo-team-size" name="teamSize" className="input" required>
            <option value="1-20">1-20</option>
            <option value="21-50">21-50</option>
            <option value="51-200">51-200</option>
            <option value="200+">200+</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="demo-role">Role</label>
          <select id="demo-role" name="role" className="input" required>
            <option value="People & Culture">People & Culture</option>
            <option value="Founder / Executive">Founder / Executive</option>
            <option value="Manager">Manager</option>
            <option value="Operations">Operations</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="demo-date">Preferred date</label>
          <input id="demo-date" name="preferredDate" className="input" type="date" required />
        </div>
        <div className="form-field">
          <label htmlFor="demo-time">Preferred time</label>
          <input id="demo-time" name="preferredTime" className="input" type="time" required />
        </div>
        <div className="form-field">
          <label htmlFor="demo-timezone">Timezone</label>
          <input id="demo-timezone" name="timezone" className="input" placeholder="Europe/Amsterdam" defaultValue="Europe/Amsterdam" required />
        </div>
        <div className="form-field">
          <label htmlFor="demo-duration">Duration</label>
          <select id="demo-duration" name="durationMinutes" className="input" defaultValue="30" required>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60 minutes</option>
          </select>
        </div>
      </div>
      <div className="form-field">
        <label htmlFor="demo-message">Message</label>
        <textarea id="demo-message" name="message" className="input" defaultValue={defaultDemoMessage} required />
      </div>
      {state.message ? <p className="auth-status auth-status-error">{state.message}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Sending request..." : "Book my demo"} <ArrowRight size={16} />
      </button>
    </form>
  );
}
