import { Property } from 'ts-convict';

export class FioConfig {
  @Property({
    default: 0,
    env: 'POSITION_REPORT_INTERVAL_IN_MINUTE',
    format: Number,
  })
  public positionReportIntervalInMinute: number;
}
