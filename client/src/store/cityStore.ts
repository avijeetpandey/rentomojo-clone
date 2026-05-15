import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const CITIES = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai'] as const;
export type City = (typeof CITIES)[number];

interface CityState {
  city: City;
  setCity: (c: City) => void;
}

export const useCityStore = create<CityState>()(
  persist(
    (set) => ({
      city: 'Bangalore',
      setCity: (city) => set({ city }),
    }),
    { name: 'rentomojo.city' },
  ),
);
