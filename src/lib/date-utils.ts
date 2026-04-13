import { parse, format, addHours } from 'date-fns'

/**
 * Converts UTC+0 time and date strings from backend into UTC+5 (Uzbekistan Time)
 * @param dateStr Format: "Apr 13"
 * @param timeStr Format: "01:25 PM"
 * @returns Object with adjusted { date, time }
 */
export const convertToUzbekTime = (dateStr: string, timeStr: string) => {
  try {
    if (!dateStr || !timeStr || dateStr === 'N/A' || timeStr === 'N/A') {
      return { date: dateStr, time: timeStr }
    }

    // Use current year as fallback for parsing
    const currentYear = new Date().getFullYear()
    const fullDateStr = `${currentYear} ${dateStr} ${timeStr}`
    
    // Parse the string: "2024 Apr 13 01:25 PM"
    const parsedDate = parse(fullDateStr, 'yyyy MMM dd hh:mm a', new Date())
    
    // Add 5 hours for UTC+5
    const adjustedDate = addHours(parsedDate, 5)
    
    return {
      date: format(adjustedDate, 'MMM dd'),
      time: format(adjustedDate, 'hh:mm a')
    }
  } catch (error) {
    console.error('Error converting time to UTC+5:', error)
    return { date: dateStr, time: timeStr }
  }
}
