export const URGENCY_ORDER = { high: 3, medium: 2, low: 1 }
// UI metadata is filled with theme colors at render time; this maps urgency -> token key + label.
export const URGENCY_META = {
  high:   { label: 'High',   toneKey: 'danger'  },
  medium: { label: 'Medium', toneKey: 'warning' },
  low:    { label: 'Low',    toneKey: 'textMuted' },
}

function dayDiff(a, b) { // a, b are 'YYYY-MM-DD'; returns a - b in whole days
  return Math.round((Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / 86400000)
}
function ymd(d) { // Date | string -> 'YYYY-MM-DD'
  const dt = d instanceof Date ? d : new Date(d)
  return dt.toISOString().slice(0, 10)
}

export function carriedOverDays(task, today) {
  const diff = dayDiff(today, task.due_date)
  return diff > 0 ? diff : 0
}

export function partitionTodayTasks(tasks, today) {
  const open = [], doneToday = [], hidden = []
  for (const t of tasks || []) {
    if (!t.completed) {
      if (dayDiff(today, t.due_date) >= 0) open.push(t)   // due today or earlier
      else hidden.push(t)                                  // scheduled for the future
    } else if (t.completed_at && ymd(t.completed_at) === today) {
      doneToday.push(t)
    } else {
      hidden.push(t)                                       // completed on a past day
    }
  }
  return { open: sortOpenTasks(open), doneToday: doneToday.sort((a,b)=> (b.completed_at||'').localeCompare(a.completed_at||'')), hidden }
}

export function sortOpenTasks(tasks) {
  return [...(tasks || [])].sort((a, b) => {
    const u = (URGENCY_ORDER[b.urgency] || 0) - (URGENCY_ORDER[a.urgency] || 0)
    if (u) return u
    return String(a.due_date).localeCompare(String(b.due_date))   // oldest first
  })
}

export function todayStr() { return new Date().toISOString().slice(0, 10) }
