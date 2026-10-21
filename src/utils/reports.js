export const monthOf = value => {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit' }).formatToParts(date);
  return `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}`;
};

export function buildReport(incidents, sources, trees, month) {
  const dates = new Map(sources.map(item => [item.id, item.detectedAt]));
  const records = incidents.filter(item => monthOf(dates.get(item.id)) === month);
  const resolved = records.filter(item => !item.isOpen);
  const responses = records.map(item => item.responseMinutes).filter(value => Number.isFinite(value) && value >= 0);
  const inspections = trees.flatMap(tree => (tree.history || []).filter(event => event.date?.slice(0, 7) === month).map(event => ({ ...event, treeId: tree.id, location: tree.location })));
  const grouped = new Map();
  records.forEach(item => {
    const key = `${item.roadId || item.location}|${item.type}`;
    const group = grouped.get(key) || { location: item.location, type: item.type, ids: [] };
    group.ids.push(item.id); grouped.set(key, group);
  });
  return { records, resolved, inspections, dates, responseCount: responses.length,
    averageResponse: responses.length ? Math.round(responses.reduce((sum, value) => sum + value, 0) / responses.length * 10) / 10 : null,
    inspectedTrees: new Set(inspections.map(item => item.treeId)).size,
    potholes: resolved.filter(item => item.type === 'Pothole').length,
    drainage: resolved.filter(item => ['Flood', 'Standing Water'].includes(item.type)).length,
    repeated: [...grouped.values()].filter(group => group.ids.length > 1),
    highRoads: [...new Set(records.filter(item => item.isOpen && ['HIGH', 'CRITICAL'].includes(item.risk)).map(item => item.location))],
  };
}

// Quote every field and neutralise spreadsheet formula prefixes, including user-entered notes.
export function csvText(rows) {
  return rows.map(row => row.map(value => {
    let text = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  }).join(',')).join('\r\n');
}
