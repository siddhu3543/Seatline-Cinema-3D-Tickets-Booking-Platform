/* Sample catalogue: three screens and four films. Used for demo mode and for seeding the live store. */
function buildSeed() {
  const LBL = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  function rows(count, tier, pattern, start) {
    const out = [];
    for (let i = 0; i < count; i++) out.push({ label: LBL[start + i], tier: tier, cells: pattern });
    return out;
  }
  const t1Std = 'SSSSS_SSSSSSSSSS_SSSSS';
  const t1Rec = '_SS_SS_SS_SS_SS_SS_SS_';
  const t2 = 'SSS_SSSSSSSS_SSS';
  const t3 = 'SS_SS__SS_SS';
  const theatres = [
    {
      id: 'aurora-1', name: 'Aurora Cinemas · Screen 1', city: 'Hyderabad', address: 'Level 4, Aurora Mall, Kondapur',
      tiers: [
        { id: 'classic', name: 'Classic', price: 190, style: 'standard' },
        { id: 'prime', name: 'Prime', price: 260, style: 'standard' },
        { id: 'recliner', name: 'Recliner', price: 480, style: 'recliner' }
      ],
      layout: { rows: [].concat(rows(4, 'classic', t1Std, 0), rows(6, 'prime', t1Std, 4), rows(2, 'recliner', t1Rec, 10)) },
      sample: true
    },
    {
      id: 'riverside-3', name: 'Riverside Multiplex · Screen 3', city: 'Visakhapatnam', address: 'Beach Road, near RK Beach',
      tiers: [
        { id: 'exec', name: 'Executive', price: 160, style: 'standard' },
        { id: 'royal', name: 'Royal', price: 240, style: 'standard' }
      ],
      layout: { rows: [].concat(rows(6, 'exec', t2, 0), rows(4, 'royal', t2, 6)) },
      sample: true
    },
    {
      id: 'aurora-gold', name: 'Aurora Gold · Screen 2', city: 'Hyderabad', address: 'Level 4, Aurora Mall, Kondapur',
      tiers: [{ id: 'gold', name: 'Gold Recliner', price: 650, style: 'recliner' }],
      layout: { rows: rows(5, 'gold', t3, 0) },
      sample: true
    }
  ];
  const sched = (theatreIds, times) => ({ theatreIds: theatreIds, times: times, start: '2026-10-30', end: '2026-12-31' });
  const movies = [
    {
      id: 'monsoon-protocol', title: 'Monsoon Protocol', language: 'Telugu', genre: 'Action thriller', cert: 'U/A 16+', runtime: 148,
      synopsis: 'A cyber-crime officer in a rain-soaked port city has one night to trace a ransom signal before the cyclone takes down the grid.',
      art: { c1: '#06222e', c2: '#13708a', c3: '#e9c46a', motif: 'rain' }, status: 'showing',
      schedule: sched(['aurora-1', 'riverside-3'], ['10:30', '14:15', '18:00', '21:45']), sample: true
    },
    {
      id: 'ninth-lighthouse', title: 'The Ninth Lighthouse', language: 'English', genre: 'Drama', cert: 'U/A 13+', runtime: 121,
      synopsis: 'A retired keeper and a runaway teenager restore a lighthouse the coast guard has already scheduled for demolition.',
      art: { c1: '#1d1328', c2: '#b4553f', c3: '#f6d9a8', motif: 'beam' }, status: 'showing',
      schedule: sched(['aurora-gold', 'riverside-3'], ['11:00', '16:30', '20:15']), sample: true
    },
    {
      id: 'orbit-seven', title: 'Orbit Seven', language: 'Hindi', genre: 'Sci-fi adventure', cert: 'U/A 7+', runtime: 134,
      synopsis: "Seven students win seats on the country's first commercial orbital flight. One of them was never on the passenger list.",
      art: { c1: '#070a24', c2: '#4b35c4', c3: '#9ee7ff', motif: 'orbit' }, status: 'showing',
      schedule: sched(['aurora-1', 'aurora-gold'], ['12:45', '17:10', '22:30']), sample: true
    },
    {
      id: 'biryani-brothers', title: 'Biryani Brothers', language: 'Telugu', genre: 'Family comedy', cert: 'U', runtime: 139,
      synopsis: "Two estranged brothers inherit their grandfather's restaurant and his recipe book, torn neatly down the middle.",
      art: { c1: '#3a1206', c2: '#d8692a', c3: '#ffe1a6', motif: 'stripes' }, status: 'showing',
      schedule: sched(['riverside-3', 'aurora-1'], ['09:45', '13:30', '19:30']), sample: true
    }
  ];
  return { theatres: theatres, movies: movies };
}
if (typeof module !== 'undefined') module.exports = buildSeed;
