export const riskLevels = ['SAFE', 'WATCH', 'HIGH', 'CRITICAL'];
// Safe2Go risk palette, shared by every page (same colours as the Incident & Response Center).
// color: one solid colour for map lines and markers, chart segments, dots and card edges.
// bg / fg: badge background and text. The badge itself is styled by the .risk-* rules in index.css.
export const riskStyles = {
  SAFE: { color: '#1e8e4e', bg: '#dff3e6', fg: '#14532d', className: 'risk-safe', label: 'Safe' },
  WATCH: { color: '#f2b705', bg: '#fdf3cf', fg: '#6b4e00', className: 'risk-watch', label: 'Watch' },
  HIGH: { color: '#e46b7d', bg: '#f9dde1', fg: '#7a0a1c', className: 'risk-high', label: 'High' },
  CRITICAL: { color: '#c8102e', bg: '#c8102e', fg: '#ffffff', className: 'risk-critical', label: 'Critical' },
};
