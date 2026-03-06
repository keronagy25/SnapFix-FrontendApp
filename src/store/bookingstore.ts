import { create } from "zustand";

export interface BookingExpert {
  id:          string;
  name:        string;
  avatar:      string;
  avatarColor: string;
  profession:  string;
  rating:      number;
  jobs:        number;
  price:       number; // EGP per hour
  badge:       string;
  about:       string;
}

export interface BookingState {
  // Step 1 — service
  serviceId:    string | null;
  serviceLabel: string | null;
  serviceEmoji: string | null;

  // Step 2 — expert
  expert: BookingExpert | null;

  // Step 3 — schedule
  date:      string | null; // ISO date string
  timeSlot:  string | null;

  // Step 4 — payment
  paymentMethod: "cash" | "card" | "wallet" | "fawry" | null;

  // Actions
  setService:       (id: string, label: string, emoji: string) => void;
  setExpert:        (expert: BookingExpert) => void;
  setSchedule:      (date: string, timeSlot: string) => void;
  setPaymentMethod: (method: BookingState["paymentMethod"]) => void;
  reset:            () => void;
}

const initial = {
  serviceId:     null,
  serviceLabel:  null,
  serviceEmoji:  null,
  expert:        null,
  date:          null,
  timeSlot:      null,
  paymentMethod: null,
};

export const useBookingStore = create<BookingState>((set) => ({
  ...initial,
  setService:       (id, label, emoji) => set({ serviceId: id, serviceLabel: label, serviceEmoji: emoji }),
  setExpert:        (expert)           => set({ expert }),
  setSchedule:      (date, timeSlot)   => set({ date, timeSlot }),
  setPaymentMethod: (paymentMethod)    => set({ paymentMethod }),
  reset:            ()                 => set({ ...initial }),
}));