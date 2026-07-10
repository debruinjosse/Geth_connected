"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function BookDemoForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="panel form-success-panel">
        <CheckCircle2 size={54} color="var(--theme-emerald)" />
        <h2>Demo request received</h2>
        <p>We’ve stored this as a demo submission. In a connected environment, this can forward directly to your CRM or sales inbox.</p>
      </div>
    );
  }

  return (
    <form className="panel demo-form-panel" onSubmit={(event) => {
      event.preventDefault();
      setSubmitted(true);
    }}>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="demo-name">Name</label>
          <input id="demo-name" className="input" placeholder="Sarah van den Berg" />
        </div>
        <div className="form-field">
          <label htmlFor="demo-email">Work email</label>
          <input id="demo-email" className="input" placeholder="sarah@company.com" />
        </div>
        <div className="form-field">
          <label htmlFor="demo-company">Company</label>
          <input id="demo-company" className="input" placeholder="ABC Company" />
        </div>
        <div className="form-field">
          <label htmlFor="demo-team-size">Team size</label>
          <select id="demo-team-size" className="input">
            <option>1-20</option>
            <option>21-50</option>
            <option>51-200</option>
            <option>200+</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="demo-role">Role</label>
          <select id="demo-role" className="input">
            <option>People & Culture</option>
            <option>Founder / Executive</option>
            <option>Manager</option>
            <option>Operations</option>
          </select>
        </div>
      </div>
      <div className="form-field">
        <label htmlFor="demo-message">Message</label>
        <textarea id="demo-message" className="input" placeholder="Tell us what kind of recognition culture you want to build." />
      </div>
      <button className="btn btn-primary" type="submit">
        Book my demo <ArrowRight size={16} />
      </button>
    </form>
  );
}
