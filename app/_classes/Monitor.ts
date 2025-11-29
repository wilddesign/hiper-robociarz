import {
  PolishRequestScheduler,
  RequestScheduler,
  Source,
} from "./RequestScheduler";
import { TickerDumper } from "./TickerDumper";
import { TickerRecordData } from "./TickerRecord";

export class GlobalMonitor {
  static monitor(data: string) {
    TickerDumper.saveStringToFile("inputstring.txt", data);
    RequestScheduler.clearAllSchedules();
    RequestScheduler.addScheduleAtTime(23, 0, new TickerRecordData(data).data);
  }
}

export class PolishMonitor extends GlobalMonitor {
  static monitor(data: string) {
    TickerDumper.saveStringToFile("polishinputstring.txt", data);
    PolishRequestScheduler.clearAllSchedules();
    PolishRequestScheduler.addScheduleAtTime(
      23,
      0,
      new TickerRecordData(data).data,
      Source.STOOQ
    );
  }

