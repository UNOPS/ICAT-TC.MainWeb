import { Platform } from '@angular/cdk/platform';
import { Component, Input, ViewChild } from '@angular/core';
import { OverlayPanel } from 'primeng/overlaypanel';
import { floorToHalf, scoresMatchMatrixCell } from 'app/shared/score-rounding.util';

@Component({
  selector: 'app-heat-map',
  templateUrl: './heat-map.component.html',
  styleUrls: ['./heat-map.component.css']
})
export class HeatMapComponent {

  @Input() xData: {label: string; value: number}[]
  @Input() yData: {label: string; value: number}[]
  @Input() score: HeatMapScore[]
  @Input() showOp?: boolean
  @Input() tableData?: TableData[]
  /**
   * When true, the dot is placed at half-step (0.5) resolution: a score whose
   * half-step remainder is .5 (e.g. 2.5) is drawn on the gridline between boxes
   * instead of centered in the box. Intended for single-assessment views where
   * each cell holds at most one point. Dashboards leave this off (centered dots).
   */
  @Input() preciseDotPosition: boolean = false

  @ViewChild('op') op: OverlayPanel;
  pointTableDatas: TableData[];
  isSafari: boolean = false

  constructor(
    public platform: Platform
  ){
    this.isSafari = platform.SAFARI
  }

  getBackgroundColor(x: number, y: number): string {
    if ((x <= -1) || (x === 1 && y === 0) || (x === 0 && y === 1) || (x === 0 && y === 0)) {
      return '#ec6665'
    } else {
      let value = x + y
      switch (value) {
        case -3:
          return '#ec6665';
        case -2:
          return '#ed816c';
        case -1:
          return '#f19f70';
        case 0:
          return '#f4b979';
        case 1:
          return '#f9d57f';
        case 2:
          return '#f98570';
        case 3:
          return '#fdbf7b';
        case 4:
          return '#fedc82';
        case 5:
          return '#a9d27f';
        case 6:
          return '#86c97d';
        case 7:
          return '#63be7b';
        default:
          return 'white';
      }
    }
  }

  getIntervention(x: number, y: number) {
    let a = this.score?.filter((item) =>
      scoresMatchMatrixCell(item.processScore, item.outcomeScore, y, x),
    ).length;

    return a;
  }

  /**
   * Positions the dot within its matrix cell. In precise mode a score sitting on
   * a half-step (e.g. 2.5) is nudged half a cell toward the next-higher value so
   * it lands on the gridline between boxes; a whole-number score stays centered.
   * Returns an empty object (no override) when precise mode is off, so the
   * existing centered rendering used by the dashboards is unchanged.
   */
  getDotStyle(x: number, y: number): { [key: string]: string } {
    if (!this.preciseDotPosition || !this.score) {
      return {};
    }

    const match = this.score.find((item) =>
      scoresMatchMatrixCell(item.processScore, item.outcomeScore, y, x),
    );
    if (!match) {
      return {};
    }

    const outcomeRemainder =
      floorToHalf(match.outcomeScore) - Math.floor(match.outcomeScore);
    const processRemainder =
      floorToHalf(match.processScore) - Math.floor(match.processScore);

    // Higher axis values are drawn first (top/left), so a .5 remainder shifts the
    // dot toward the top/left gridline. left/top are percentages of the cell.
    const left =
      outcomeRemainder === 0.5 ? (this.isDescending(this.xData) ? '0%' : '100%') : '50%';
    const top =
      processRemainder === 0.5 ? (this.isDescending(this.yData) ? '0%' : '100%') : '50%';

    return {
      position: 'absolute',
      left,
      top,
      transform: 'translate(-50%, -50%)',
      margin: '0',
    };
  }

  private isDescending(data?: { value: number }[]): boolean {
    return !!data && data.length > 1 && data[0].value > data[data.length - 1].value;
  }

  enterHeatMapPoint(x: number, y: number, event: any) {
    if (this.tableData) {
      this.pointTableDatas = this.tableData.filter((item) =>
        scoresMatchMatrixCell(item.processScore, item.outcomeScore, y, x),
      );
      if (this.pointTableDatas.length > 0) {
        this.op.show(event);
      }
    }
  }

  leaveHeatMapPoint() {
    this.pointTableDatas = [];
  }

}

export interface HeatMapScore {
  processScore: number
  outcomeScore: number
}

export interface TableData {
  interventionId: string
  interventionName: string
  processScore: number
  outcomeScore: number
}
