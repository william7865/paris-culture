export const exportIcs = (event) => {
  const fmt = (iso) => iso ? new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z' : '';
  const escape = (str) => (str || '').replace(/[\\;,\n]/g, (c) => '\\' + c);

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Paris Culture//FR',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(event.date_start)}`,
    `DTEND:${fmt(event.date_end)}`,
    `SUMMARY:${escape(event.title)}`,
    `DESCRIPTION:${escape(event.lead_text)}`,
    `LOCATION:${escape(event.address_name)}`,
    `URL:${event.url || ''}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${(event.title || 'event').slice(0, 40).replace(/[^a-z0-9]/gi, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const shareEvent = async (event, addToast) => {
  const url  = window.location.href;
  const data = { title: event.title, text: event.lead_text || '', url };
  if (navigator.share) {
    try { await navigator.share(data); } catch {}
  } else {
    await navigator.clipboard.writeText(url).catch(() => {});
    addToast('Lien copié dans le presse-papier.', 'info');
  }
};
