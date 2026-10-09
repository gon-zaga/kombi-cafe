import { Pool } from "pg";
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get current time in Manila timezone
function getManilaTime(): Date {
  return new Date(new Date().toLocaleString("en-US", {
    timeZone: "Asia/Manila"
  }));
}

// Check if store is currently open based on settings
export async function isStoreOpen(): Promise<boolean> {
  try {
    const result = await pool.query(
      "SELECT opening_time, closing_time FROM store_settings ORDER BY id DESC LIMIT 1"
    );
    
    if (result.rows.length === 0) {
      // Default to 8:00-20:00 if no settings
      return isWithinDefaultHours();
    }
    
    const { opening_time, closing_time } = result.rows[0];
    const now = getManilaTime();
    
    // Convert times to Date objects for comparison
    const openingHours = opening_time.getHours();
    const openingMinutes = opening_time.getMinutes();
    const closingHours = closing_time.getHours();
    const closingMinutes = closing_time.getMinutes();
    
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    
    const openingTotalMinutes = openingHours * 60 + openingMinutes;
    const closingTotalMinutes = closingHours * 60 + closingMinutes;
    const currentTotalMinutes = currentHours * 60 + currentMinutes;
    
    // Handle case where closing time is after midnight (e.g., 2:00 AM)
    if (closingTotalMinutes < openingTotalMinutes) {
      // Store crosses midnight (e.g., 20:00 to 02:00)
      return currentTotalMinutes >= openingTotalMinutes || currentTotalMinutes <= closingTotalMinutes;
    } else {
      // Normal same-day hours
      return currentTotalMinutes >= openingTotalMinutes && currentTotalMinutes <= closingTotalMinutes;
    }
  } catch (error) {
    console.error("Failed to check store hours:", error);
    // Default to open if we can't check
    return true;
  }
}

// Helper function for default hours (8:00-20:00)
function isWithinDefaultHours(): boolean {
  const now = getManilaTime();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTotalMinutes = currentHours * 60 + currentMinutes;
  
  const openingTotalMinutes = 8 * 60; // 8:00 AM
  const closingTotalMinutes = 20 * 60; // 8:00 PM
  
  return currentTotalMinutes >= openingTotalMinutes && currentTotalMinutes <= closingTotalMinutes;
}

// Get formatted store hours for display
export async function getStoreHours(): Promise<{ opening: string; closing: string }> {
  try {
    const result = await pool.query(
      "SELECT opening_time, closing_time FROM store_settings ORDER BY id DESC LIMIT 1"
    );
    
    if (result.rows.length === 0) {
      return { opening: "08:00", closing: "20:00" };
    }
    
    const { opening_time, closing_time } = result.rows[0];
    return {
      opening: opening_time.toString().slice(0, 5), // Extract HH:MM
      closing: closing_time.toString().slice(0, 5)   // Extract HH:MM
    };
  } catch (error) {
    console.error("Failed to get store hours:", error);
    return { opening: "08:00", closing: "20:00" };
  }
}