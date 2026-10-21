import { Signal, Wifi, BatteryFull, Route, Send, CheckCheck, UsersRound } from 'lucide-react';
import { formatTime, getDemoNow, notifyResidents } from '../../utils/incidentStore';

// Phone-style preview of what residents receive. No real messages are sent.
export default function ResidentAlertPreview({ incident }) {
  const residents = incident.residents;
  if (!residents) return null;
  const closed = incident.roadClosed || incident.roadEverClosed;
  const title = closed ? residents.title : residents.titleOpen || residents.title;
  const message = closed ? residents.message : residents.messageOpen || residents.message;
  const sent = incident.notifiedAt != null;
  return (
    <section className="inc-card inc-alert-preview" aria-label="Resident alert preview">
      <div className="inc-card-head">
        <h3>Resident alert</h3>
        <span className={`inc-pill ${sent ? 'inc-pill-ok' : ''}`}>{sent ? `Sent ${formatTime(incident.notifiedAt)}` : 'Preview'}</span>
      </div>
      <div className="inc-phone">
        <div className="inc-phone-screen">
          <div className="inc-phone-status">
            <span className="inc-mono">{formatTime(sent ? incident.notifiedAt : getDemoNow())}</span>
            <span><Signal size={11} aria-hidden="true" /><Wifi size={11} aria-hidden="true" /><BatteryFull size={13} aria-hidden="true" /></span>
          </div>
          <div className="inc-notif">
            <span className="inc-notif-icon"><Route size={15} aria-hidden="true" /></span>
            <span className="min-w-0">
              <span className="inc-notif-app">Safe2Go · {sent ? 'now' : 'draft'}</span>
              <strong>{title}</strong>
              <span className="inc-notif-msg">{message}</span>
            </span>
          </div>
        </div>
      </div>
      <p className="inc-alert-reach"><UsersRound size={13} aria-hidden="true" />{residents.count.toLocaleString()} residents · {residents.zone}</p>
      {sent ? (
        <p className="inc-sent-note"><CheckCheck size={14} aria-hidden="true" />Delivered to the Safe2Go resident channel</p>
      ) : (
        <button type="button" className="inc-btn inc-btn-secondary w-full" onClick={() => notifyResidents(incident.id)}>
          <Send size={14} aria-hidden="true" />Notify residents
        </button>
      )}
    </section>
  );
}
