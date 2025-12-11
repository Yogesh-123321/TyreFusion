const API_BASE = import.meta.env.VITE_API_BASE;

export async function fetchWidths() {
  const r = await fetch(`${API_BASE}/tyres/distinct/widths`);
  return r.json();
}

export async function fetchAspects(width) {
  const r = await fetch(`${API_BASE}/tyres/distinct/aspects?width=${width}`);
  return r.json();
}

export async function fetchRims(width, aspect) {
  const r = await fetch(`${API_BASE}/tyres/distinct/rims?width=${width}&aspect=${aspect}`);
  return r.json();
}
