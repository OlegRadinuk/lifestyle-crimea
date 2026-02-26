// lib/ics/parser.ts
import ICAL from 'ical.js';

export interface IcsEvent {
  start: string;  // YYYY-MM-DD
  end: string;    // YYYY-MM-DD
  uid?: string;
  summary?: string;
}

export async function fetchIcs(url: string): Promise<IcsEvent[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StylishLife/1.0; +https://stylelife.ru)',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const icsData = await response.text();
    return parseIcsData(icsData);
  } catch (error) {
    console.error('Ошибка загрузки ICS:', error);
    throw error;
  }
}

export function parseIcsData(icsData: string): IcsEvent[] {
  try {
    const jcalData = ICAL.parse(icsData);
    const comp = new ICAL.Component(jcalData);
    const events = comp.getAllSubcomponents('vevent');

    return events.map(event => {
      const vevent = new ICAL.Event(event);
      const startDate = vevent.startDate.toJSDate();
      const endDate = vevent.endDate.toJSDate();
      return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        uid: vevent.uid,
        summary: vevent.summary,
      };
    });
  } catch (error) {
    console.error('Ошибка парсинга ICS:', error);
    return [];
  }
}

export function generateIcs(bookings: Array<{ check_in: string; check_out: string }>): string {
  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Stylish Life//RU
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

  bookings.forEach((booking, index) => {
    const uid = `booking-${index}-${Date.now()}@stylelife.ru`;
    const dtStart = booking.check_in.replace(/-/g, '');
    const dtEnd = booking.check_out.replace(/-/g, '');
    icsContent += `
BEGIN:VEVENT
UID:${uid}
DTSTART;VALUE=DATE:${dtStart}
DTEND;VALUE=DATE:${dtEnd}
SUMMARY:Занято
TRANSP:OPAQUE
END:VEVENT
`;
  });

  icsContent += `END:VCALENDAR`;
  return icsContent;
}
