import { CITIES, useCityStore, type City } from '@/store/cityStore';
import { MapPin } from 'lucide-react';

export function CitySelector({ className }: { className?: string }) {
  const { city, setCity } = useCityStore();
  return (
    <label className={`inline-flex items-center gap-2 text-sm ${className ?? ''}`}>
      <MapPin className="h-4 w-4 text-fg-muted" />
      <span className="text-fg-muted">City</span>
      <select
        value={city}
        onChange={(e) => setCity(e.target.value as City)}
        className="h-9 rounded-md border border-border bg-canvas px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      >
        {CITIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </label>
  );
}
