import { Platform } from '@angular/cdk/platform';
import { Component, Input, ViewChild } from '@angular/core';
import { OverlayPanel } from 'primeng/overlaypanel';
import { scoresMatchMatrixCell } from 'app/shared/score-rounding.util';

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
