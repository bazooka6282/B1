export type Bus = { registration: string; name: string; category: string; photo: string | null; status?: string; visible?: boolean; purchase_amount?: number };
export const seed: Bus[] = [
  { registration: 'KL05Z2113', name: 'Ayshu', category: 'TP', photo: '/fleet/ayshu.webp' },
  { registration: 'KL03P5108', name: 'Feemol', category: 'TP', photo: '/fleet/feemol.webp' },
  { registration: 'KL08AL4545', name: 'Zaeem', category: 'TP', photo: '/fleet/zaeem.webp' },
  { registration: 'KL02Y0079', name: 'Bazooka', category: 'TP', photo: '/fleet/route.webp' },
  { registration: 'KL55G7430', name: 'Bazooka', category: 'TP', photo: null },
];
export const numberPlate = (reg: string) => reg.replace(/^(KL\d{2})([A-Z]+)(\d+)$/, '$1 $2 $3');
export const inr = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
export function photos(bus: Bus) {
  const extras: Record<string, string[]> = {
    KL05Z2113: ['/fleet/ayshu-front.webp'],
    KL03P5108: ['/fleet/feemol-road.webp'],
  };
  return bus.photo ? [bus.photo, ...(bus.photo === seed.find(item => item.registration === bus.registration)?.photo ? extras[bus.registration] ?? [] : [])] : [];
}
