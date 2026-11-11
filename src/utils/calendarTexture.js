import * as THREE from 'three';

////////////////////////////////////////////////////////////////////Setting up the style///////////////////////////////////////////////////////////////
const FETCH_DAYS_AHEAD = 42; // ~6 weeks, covers a full month grid
const MAX_DOTS_PER_DAY = 3;
const SHOW_TITLE = true;

const FONT = '"Helvetica Neue", Arial, sans-serif';
const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const COLS = DAY_LABELS.length;

const THEME = {
  paper: '#fbfbfb',
  title: '#293241',
  accent: '#ee6c4d',     // "today" circle
  dot: '#ea4335',        // event markers
  weekday: '#3d5a80',
  text: '#1f1f26',
  weekendText: '#3d5a80',
  otherMonth: '#c2c2cc',
  weekendTint: '#e1e8df',
  line: '#babbbd',
  todayText: '#ffffff',
};

//////////////////////////////////////////////////////////////Setting up the Calendar////////////////////////////////////////////////////////////////////

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function isSameDay(a, b) {
  return dayKey(a) === dayKey(b);
}

/*
 * Builds a Sunday-start grid (rows of 7 dates) covering the given month,
 * including the leading/trailing days from adjacent months needed to fill
 * the first and last rows.
 */
function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  // Back up to the Sunday on or before the 1st (getDay(): 0 = Sun)
  const cursor = new Date(firstOfMonth);
  cursor.setDate(cursor.getDate() - cursor.getDay());

  const weeks = [];
  while (weeks.length < 6) {
    const week = [];
    for (let i = 0; i < COLS; i++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    if (week[COLS - 1] >= lastOfMonth) break;
  }
  return weeks;
}

////////////////////////////////////////////////////////////////////Setting up the Google Calendar///////////////////////////////////////////////////////////////

/*
 * Fetches upcoming events from a public Google Calendar.
 * Only start times are used, so event titles are never drawn.
 */
async function fetchGoogleCalendarEvents(calendarId, apiKey, maxResults = 100) {
  const now = new Date();
  const timeMax = new Date(now);
  timeMax.setDate(timeMax.getDate() + FETCH_DAYS_AHEAD);

  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
  );
  url.searchParams.set('key', apiKey);
  url.searchParams.set('timeMin', now.toISOString());
  url.searchParams.set('timeMax', timeMax.toISOString());
  url.searchParams.set('maxResults', String(maxResults));
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Calendar API error ${res.status}: ${body}`);
  }
  const data = await res.json();
  return data.items || [];
}

/* Returns a Map of dayKey -> number of events that day. */
function countEventsByDay(events) {
  const counts = new Map();
  events.forEach((event) => {
    const startStr = event.start?.dateTime || event.start?.date;
    if (!startStr) return;
    const key = dayKey(new Date(startStr));
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return counts;
}

////////////////////////////////////////////////////////////////////Setting up the Calendar Format///////////////////////////////////////////////////////////////

function computeLayout(canvas, rowCount) {
  const { width, height } = canvas;
  const titleH = SHOW_TITLE ? height * 0.1 : 0;
  const headerH = height * 0.07;
  const gridTop = titleH + headerH;
  const colWidth = width / COLS;
  const rowHeight = (height - gridTop) / rowCount;
  const numSize = Math.floor(Math.min(colWidth, rowHeight) * 0.3);
  return { width, height, titleH, headerH, gridTop, colWidth, rowHeight, numSize };
}

function drawBackground(ctx, L) {
  ctx.fillStyle = THEME.paper;
  ctx.fillRect(0, 0, L.width, L.height);
}

function drawTitle(ctx, L, referenceDate) {
  if (!SHOW_TITLE) return;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = THEME.title;
  ctx.font = `bold ${Math.floor(L.titleH * 0.5)}px ${FONT}`;
  const title = referenceDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  ctx.fillText(title, L.width / 2, L.titleH * 0.55);
}

function drawWeekendTint(ctx, L) {
  ctx.fillStyle = THEME.weekendTint;
  ctx.fillRect(0, L.gridTop, L.colWidth, L.height - L.gridTop);                 // Sunday
  ctx.fillRect(L.colWidth * (COLS - 1), L.gridTop, L.colWidth, L.height - L.gridTop); // Saturday
}

function drawWeekdayHeader(ctx, L) {
  ctx.fillStyle = THEME.weekday;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.floor(L.headerH * 0.42)}px ${FONT}`;
  DAY_LABELS.forEach((label, i) => {
    ctx.fillText(label, i * L.colWidth + L.colWidth / 2, L.titleH + L.headerH / 2);
  });
}

function drawGridLines(ctx, L, rowCount) {
  ctx.strokeStyle = THEME.line;

  // Header underline
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, L.gridTop);
  ctx.lineTo(L.width, L.gridTop);
  ctx.stroke();

  // Vertical + horizontal dividers
  ctx.lineWidth = 2;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * L.colWidth, L.gridTop);
    ctx.lineTo(c * L.colWidth, L.height);
    ctx.stroke();
  }
  for (let r = 1; r < rowCount; r++) {
    ctx.beginPath();
    ctx.moveTo(0, L.gridTop + r * L.rowHeight);
    ctx.lineTo(L.width, L.gridTop + r * L.rowHeight);
    ctx.stroke();
  }
}

function drawEventDots(ctx, L, x, y, count) {
  const n = Math.min(count, MAX_DOTS_PER_DAY);
  const r = L.numSize * 0.17;
  const gap = r * 3;
  const startX = x + L.colWidth / 2 - ((n - 1) * gap) / 2;
  ctx.fillStyle = THEME.dot;
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.arc(startX + i * gap, y + L.rowHeight * 0.76, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDayCells(ctx, L, weeks, month, eventCounts) {
  const today = new Date();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${L.numSize}px ${FONT}`;

  weeks.forEach((week, rowIndex) => {
    week.forEach((date, colIndex) => {
      const x = colIndex * L.colWidth;
      const y = L.gridTop + rowIndex * L.rowHeight;
      const cx = x + L.colWidth * 0.26;
      const cy = y + L.rowHeight * 0.22;

      const inMonth = date.getMonth() === month;
      const isWeekend = colIndex === 0 || colIndex === COLS - 1;

      // Date number (with a circle behind it for today)
      if (isSameDay(date, today)) {
        ctx.beginPath();
        ctx.fillStyle = THEME.accent;
        ctx.arc(cx, cy, L.numSize * 0.85, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = THEME.todayText;
      } else if (!inMonth) {
        ctx.fillStyle = THEME.otherMonth;
      } else {
        ctx.fillStyle = isWeekend ? THEME.weekendText : THEME.text;
      }
      ctx.fillText(String(date.getDate()), cx, cy);

      // Event dots
      const count = eventCounts.get(dayKey(date)) || 0;
      if (count > 0) drawEventDots(ctx, L, x, y, count);
    });
  });
}

/* Draws the whole month view. This is the only drawing function called from outside. */
function drawMonthGrid(canvas, events, referenceDate = new Date()) {
  const ctx = canvas.getContext('2d');
  const weeks = buildMonthGrid(referenceDate.getFullYear(), referenceDate.getMonth());
  const L = computeLayout(canvas, weeks.length);
  const eventCounts = countEventsByDay(events);

  drawBackground(ctx, L);
  drawTitle(ctx, L, referenceDate);
  drawWeekendTint(ctx, L);
  drawWeekdayHeader(ctx, L);
  drawGridLines(ctx, L, weeks.length);
  drawDayCells(ctx, L, weeks, referenceDate.getMonth(), eventCounts);
}

/* Simple full-canvas message, used for the loading and error states. */
function drawMessage(canvas, text, { bg, fg }) {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = fg;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${Math.floor(canvas.height * 0.04)}px sans-serif`;
  ctx.fillText(text, canvas.width * 0.05, canvas.height * 0.1);
}

/////////////////////////////////////////////////////////////////Setting up the API Key///////////////////////////////////////////////////////////////

/*
 * Creates a THREE.CanvasTexture wired up to a Google Calendar.
 * Returns { texture, refresh } immediately. The texture shows "Loading..."
 * and fills in once the first fetch resolves.
 */
export function createCalendarTexture({
  calendarId,
  apiKey,
  canvasWidth = 1024,
  canvasHeight = 1024,
}) {
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false; // matches glTF UV convention; flip if it renders mirrored

  drawMessage(canvas, 'Loading calendar...', { bg: '#ffffff', fg: '#888888' });
  texture.needsUpdate = true;

  function refresh() {
    return fetchGoogleCalendarEvents(calendarId, apiKey)
      .then((events) => {
        //console.log('Events fetched:', events.length, events);
        drawMonthGrid(canvas, events);
      })
      .catch((err) => {
        console.error('Failed to refresh calendar texture:', err);
        drawMessage(canvas, 'Calendar failed to load', { bg: '#fff0f0', fg: '#c00000' });
      })
      .finally(() => {
        texture.needsUpdate = true;
      });
  }

  refresh(); // fire off immediately, don't block the caller
  return { texture, refresh };
}