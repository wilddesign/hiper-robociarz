import { Actuator } from "./Actuator";
import { Frequencies } from "./DataFetcher";
import { ITickerRecord } from "./TickerRecord";

type IntervalID = ReturnType<typeof setInterval>;

export class RequestScheduler {
  static schedules: IntervalID[] = [];
  static timeOuts: IntervalID[] = [];

  static clearAllSchedules() {
    // Iterate over the schedules array and stop each interval
    this.schedules.forEach((intervalId) => {
      clearInterval(intervalId);
    });

    // Clear the array itself
    this.schedules = [];
    // Iterate over the schedules array and stop each interval
    this.timeOuts.forEach((intervalId) => {
      clearTimeout(intervalId);
    });

    // Clear the array itself
    this.timeOuts = [];
  }

  private static isLastDay(dt: Date) {
    return new Date(dt.getTime() + 86400000).getDate() === 1;
  }

  /**
   * Schedules a recurring task to start at a specific clock time today.
   * NOTE: This only adds the recurring part (the setInterval) to the schedules list.
   * The initial setTimeout is managed separately.
   * * @param callback The function to execute periodically.
   * @param intervalMs The period for the recurring execution in milliseconds.
   * @param startHour The hour (0-23) to start.
   * @param startMinute The minute (0-59) to start.
   * @returns The TimeoutID for the initial delay (not the interval ID).
   */
  public static addScheduleAtTime(
    startHour: number,
    startMinute: number,
    scheduleRequest: ITickerRecord[]
  ): ReturnType<typeof setTimeout> {
    const initialDelay = calculateInitialDelay(startHour, startMinute);

    console.log(
      `Initial execution scheduled to start in ${initialDelay / 1000} seconds.`
    );

    const initialTimeoutId = setTimeout(() => {
      RequestScheduler.addSchedule(scheduleRequest);
    }, initialDelay);
    this.timeOuts.push(initialTimeoutId);
    return initialTimeoutId; // Return the initial Timeout ID if you need to cancel the startup
  }

  static addSchedule(scheduleRequest: ITickerRecord[]) {
    const intervalId = setInterval(async () => {
      Actuator.getStockDataAnalyzeAndReport({
        frequency: Frequencies.DAILY,
        cutoff: 0.05,
        stocks: scheduleRequest,
      });
      const today = new Date().getDay();
      if (today == 6) {
        Actuator.getStockDataAnalyzeAndReport({
          frequency: Frequencies.WEEKLY,
          cutoff: 0.07,
          stocks: scheduleRequest,
        });
      }
      const now = new Date();
      if (this.isLastDay(now)) {
        Actuator.getStockDataAnalyzeAndReport({
          frequency: Frequencies.MONTHLY,
          cutoff: 0.1,
          stocks: scheduleRequest,
        });
      }
    }, 24 * 60 * 60000);

    this.schedules.push(intervalId);

    return intervalId;
  }
}

/**
 * Calculates the delay (in milliseconds) from now until a specific time today.
 * @param hour The hour (0-23).
 * @param minute The minute (0-59).
 * @returns The delay in milliseconds.
 */
function calculateInitialDelay(hour: number, minute: number): number {
  const now = new Date();
  const target = new Date();

  // Set the target time for today
  target.setHours(hour, minute, 0, 0);

  // If the target time has already passed today, set it for tomorrow (optional, but robust)
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  // Calculate the difference in milliseconds
  return target.getTime() - now.getTime();
}
