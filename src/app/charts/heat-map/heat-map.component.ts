import { Platform } from '@angular/cdk/platform';
import { Component, Input, OnChanges, ViewChild } from '@angular/core';
import { OverlayPanel } from 'primeng/overlaypanel';
import { floorToHalf, scoresMatchMatrixCell } from 'app/shared/score-rounding.util';

@Component({
  selector: 'app-heat-map',
  templateUrl: './heat-map.component.html',
  styleUrls: ['./heat-map.component.css']
})
export class HeatMapComponent implements OnChanges {

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
  private dotsByCell = new Map<string, HeatMapDot[]>();

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

  ngOnChanges(): void {
    this.buildDots();
  }

  /**
   * Dots to draw in a cell. Precomputed in ngOnChanges so the array reference is
   * stable across change detection (a fresh array each cycle would thrash *ngFor).
   */
  getDots(x: number, y: number): HeatMapDot[] {
    return this.dotsByCell.get(x + '|' + y) || [];
  }

  /**
   * Groups the scores of each cell into the dots to render.
   *
   * In precise mode a score is placed at half-step (0.5) resolution: the
   * remainder left after flooring to a half is either 0 or 0.5 on each axis, so
   * a cell has at most four positions — centre, the gridline it shares with the
   * next-higher outcome, the gridline it shares with the next-higher process, or
   * the corner where both meet. Scores are grouped by that position so each
   * group keeps the single counted dot the matrix already uses.
   *
   * When precise mode is off, every score in a cell forms one centred dot, which
   * is the original behaviour.
   */
  private buildDots(): void {
    this.dotsByCell = new Map<string, HeatMapDot[]>();
    if (!this.xData || !this.yData) {
      return;
    }

    const xDescending = this.isDescending(this.xData);
    const yDescending = this.isDescending(this.yData);

    for (const x of this.xData) {
      for (const y of this.yData) {
        const matches = (this.score || []).filter((item) =>
          scoresMatchMatrixCell(item.processScore, item.outcomeScore, y.value, x.value),
        );
        if (matches.length === 0) {
          continue;
        }

        const dots = new Map<string, HeatMapDot>();
        for (const item of matches) {
          const outcomeRemainder = this.preciseDotPosition
            ? floorToHalf(item.outcomeScore) - Math.floor(item.outcomeScore)
            : 0;
          const processRemainder = this.preciseDotPosition
            ? floorToHalf(item.processScore) - Math.floor(item.processScore)
            : 0;

          const key = outcomeRemainder + '|' + processRemainder;
          let dot = dots.get(key);
          if (!dot) {
            // Higher axis values are drawn first (top/left), so a .5 remainder
            // shifts the dot onto the top/left gridline. Percentages are of the cell.
            dot = {
              outcomeRemainder,
              processRemainder,
              count: 0,
              style: {
                position: 'absolute',
                left:
                  outcomeRemainder === 0.5 ? (xDescending ? '0%' : '100%') : '50%',
                top:
                  processRemainder === 0.5 ? (yDescending ? '0%' : '100%') : '50%',
                transform: 'translate(-50%, -50%)',
                margin: '0',
              },
            };
            dots.set(key, dot);
          }
          dot.count++;
        }

        this.dotsByCell.set(x.value + '|' + y.value, Array.from(dots.values()));
      }
    }
  }

  private isDescending(data?: { value: number }[]): boolean {
    return !!data && data.length > 1 && data[0].value > data[data.length - 1].value;
  }

  enterHeatMapPoint(x: number, y: number, event: any, dot?: HeatMapDot) {
    if (this.tableData) {
      this.pointTableDatas = this.tableData.filter((item) => {
        if (!scoresMatchMatrixCell(item.processScore, item.outcomeScore, y, x)) {
          return false;
        }
        if (!this.preciseDotPosition || !dot) {
          return true;
        }
        // Only the interventions sitting at this dot's half-step position.
        return (
          floorToHalf(item.outcomeScore) - Math.floor(item.outcomeScore) ===
            dot.outcomeRemainder &&
          floorToHalf(item.processScore) - Math.floor(item.processScore) ===
            dot.processRemainder
        );
      });
      if (this.pointTableDatas.length > 0) {
        this.op.show(event);
      }
    }
  }

  leaveHeatMapPoint() {
    this.pointTableDatas = [];
  }

}

export interface HeatMapDot {
  /** 0 or 0.5 — how far past the whole-number cell the score sits on each axis. */
  outcomeRemainder: number
  processRemainder: number
  /** How many scores share this position. */
  count: number
  style: { [key: string]: string }
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
