'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTableStore } from '@/store/TableStore';
import Header from '@/app/ui/Header';

const TOTAL_TABLES = 7;

export default function TableSelect() {
  const router = useRouter();
  const { setTable } = useTableStore();
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [formattedOpeningTime, setFormattedOpeningTime] = useState<string>('08:00 AM');
  const [formattedClosingTime, setFormattedClosingTime] = useState<string>('08:00 PM');

  useEffect(() => {
    async function checkStoreStatus() {
      try {
        setLoading(true);
        const response = await fetch('/api/settings');
        if (!response.ok) {
          throw new Error('Failed to fetch store settings');
        }
        const data = await response.json();

        // Get current time in Manila (UTC+8)
        const now = new Date();
        const manilaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // Add 8 hours for Manila timezone
        const manilaHours = manilaTime.getHours();
        const manilaMinutes = manilaTime.getMinutes();
        const currentManilaMinutes = manilaHours * 60 + manilaMinutes;

        // Parse opening and closing times (format: HH:MM or HH:MM:SS)
        const parseTime = (timeStr) => {
          // Handle null or undefined
          if (!timeStr) {
            return 0; // Default to midnight
          }
          const parts = timeStr.split(':');
          // Handle cases where the string doesn't have enough parts
          const hours = parseInt(parts[0], 10) || 0;
          const minutes = parseInt(parts[1], 10) || 0;
          return hours * 60 + minutes;
        };

        const openingMinutes = parseTime(data.opening_time);
        const closingMinutes = parseTime(data.closing_time);

        // Format times for display (12-hour format with AM/PM)
        const formatTimeFromMinutes = (totalMinutes) => {
          // Handle invalid input
          if (isNaN(totalMinutes) || totalMinutes < 0) {
            return "12:00 AM"; // Default to midnight
          }
          
          let hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          const ampm = hours >= 12 ? 'PM' : 'AM';
          hours = hours % 12;
          hours = hours ? hours : 12; // the hour "0" should be "12"
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        };

        setFormattedOpeningTime(formatTimeFromMinutes(openingMinutes));
        setFormattedClosingTime(formatTimeFromMinutes(closingMinutes));

          // Check if store is open using modulo arithmetic to handle crossing midnight
          const L = 24 * 60; // Minutes in a day
          const openDuration = (closingMinutes - openingMinutes + L) % L; // Ensure positive
          const isOpenNow = ((currentManilaMinutes - openingMinutes + L) % L) < openDuration;

        setIsOpen(isOpenNow);
      } catch (err) {
        console.error('Failed to check store status:', err);
        setError('Could not check store status');
        // Default to open if we can't check
        setIsOpen(true);
        // Default values (08:00 opening, 20:00 closing)
        const defaultOpeningMinutes = 8 * 60; // 08:00
        const defaultClosingMinutes = 20 * 60; // 20:00
        setFormattedOpeningTime(formatTimeFromMinutes(defaultOpeningMinutes));
        setFormattedClosingTime(formatTimeFromMinutes(defaultClosingMinutes));
      } finally {
        setLoading(false);
      }
    }
    
    checkStoreStatus();
    
    // Check every minute to update status if needed
    const interval = setInterval(checkStoreStatus, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSelect = (tableNumber: number) => {
    if (!isOpen) {
      // Don't allow table selection if closed
      return;
    }
    setTable(tableNumber);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-800 border-t-transparent" />
        <p className="mt-4 text-dark-brown">Checking store status...</p>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center">
        <div className="text-center py-12">
          <div className="w-20 h-20 mb-6">
            <div className="absolute inset-0 border-4 border-amber-200 rounded-full animate-spin" />
            <div className="absolute inset-0 border-4 border-amber-600 rounded-full border-t-transparent animate-spin" />
            <div className="absolute inset-2 border-4 border-amber-100 rounded-full border-b-transparent animate-spin reverse" style={{ animationDuration: '1.5s' }} />
          </div>
          <h2 className="font-roboto-slab text-5xl text-dark-brown font-bold mb-4">
            STORE CLOSED
          </h2>
          <p className="text-dark-brown/60 text-xl mb-6">
            We're currently closed. Please come back during our opening hours.
          </p>
          <div className="bg-white/20 rounded-xl px-6 py-4 text-dark-brown/80">
            Opening hours: {formattedOpeningTime} - {formattedClosingTime}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <h2 className="font-roboto-slab text-3xl text-dark-brown text-center mb-2">
          Select Your Table
        </h2>
        <p className="text-dark-brown/60 text-center mb-8">
          Tap the table you are sitting at to start ordering
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-2xl">
          {Array.from({ length: TOTAL_TABLES }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => handleSelect(num)}
              className="bg-card-cream hover:bg-amber-100 border-2 border-dark-brown/20 hover:border-amber-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 transition-all duration-200 active:scale-95"
            >
              <span className="text-4xl font-roboto-slab font-bold text-dark-brown">
                {num}
              </span>
              <span className="text-xs font-roboto-condensed tracking-wide text-dark-brown/60">
                TABLE
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}