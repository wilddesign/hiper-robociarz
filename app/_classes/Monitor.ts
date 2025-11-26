import { RequestScheduler, Source } from "./RequestScheduler";
import { TickerDumper } from "./TickerDumper";
import { TickerRecordData } from "./TickerRecord";

export class GlobalMonitor {
  static monitor(data: string) {
    TickerDumper.saveStringToFile("inputstring.txt", data);
    const scheduler = new RequestScheduler();
    scheduler.clearAllSchedules();
    scheduler.addScheduleAtTime(23, 0, new TickerRecordData(data).data);
  }
}

export class PolishMonitor extends GlobalMonitor {
  static monitor(data: string) {
    TickerDumper.saveStringToFile("polishinputstring.txt", data);
    const scheduler = new RequestScheduler();
    scheduler.clearAllSchedules();
    scheduler.addScheduleAtTime(
      23,
      0,
      new TickerRecordData(data).data,
      Source.STOOQ
    );
  }

  // static polishGainersMonitor() {
  //   // TickerDumper.saveStringToFile("polishinputstring.txt", data);
  //   const scheduler = new RequestScheduler();
  //   scheduler.clearAllSchedules();
  //   // scheduler.addScheduleAtTime(18, 0, new TickerRecordData(data).data);
  // }
}

// static polishGainersMonitor() {
//   // TickerDumper.saveStringToFile("polishinputstring.txt", data);
//   const scheduler = new RequestScheduler();
//   scheduler.clearAllSchedules();
//   // scheduler.addScheduleAtTime(18, 0, new TickerRecordData(data).data);
// }
