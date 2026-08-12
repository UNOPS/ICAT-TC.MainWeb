import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Portfolio, PortfolioControllerServiceProxy } from 'shared/service-proxies/service-proxies';
import { floorToHalf } from 'app/shared/score-rounding.util';

@Component({
  selector: 'app-portfolio-result',
  templateUrl: './portfolio-result.component.html',
  styleUrls: ['./portfolio-result.component.css']
})
export class PortfolioResultComponent implements OnInit {

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private portfolioServiceProxy: PortfolioControllerServiceProxy,
  ) { }

  portfolioId: number;
  portfolio: Portfolio;
  card: any[] = [];
  assessList: any = [];
  load: boolean = false;

  processData: any = [];
  outcomeData: any[] = [];
  outcomeData2: any[] = [];
  allData: any = [];

  tableShow: boolean = false;
  tableShow2: boolean = false;
  tableShow3: boolean = false;
  tableShow4: boolean = false;

  noOfAssessments: number;

  @ViewChild('content', { static: false }) el!: ElementRef;
  @ViewChild('content') content: ElementRef;

  ngOnInit(): void {

    this.tableShow = false;
    this.tableShow2 = false;
    this.tableShow3 = false;
    this.tableShow4 = false;
    this.route.queryParams.subscribe((params: { [x: string]: number; }) => {
      this.portfolioId = params['id'];
    });



    this.portfolioServiceProxy.assessmentsByPortfolioId(this.portfolioId).subscribe(async (res: any) => {
      this.assessList = res;

      setTimeout(() => {
        this.load = true;
      }, 1000);
    });


    this.portfolioServiceProxy.assessmentsDataByAssessmentId(this.portfolioId).subscribe(async (res: any) => {
      this.processData = [];
      this.outcomeData = [];
      this.outcomeData2 = [];

      for (let data of res) {
        this.processData = [];
        this.outcomeData = [];
        this.outcomeData2 = [];
        for (let x of data.result) {
          if (x.type === 'process') {
            this.processData.push(x);
          }

          if (x.type === 'outcome' && (x.name === 'GHG Scale of the Outcome' || x.name === 'SDG Scale of the Outcome')) {

            this.outcomeData.push(x);
          }

          if (x.type === 'outcome' && (x.name === 'GHG Time frame over which the outcome is sustained' || x.name === 'SDG Time frame over which the outcome is sustained')) {

            this.outcomeData2.push(x);
          }
        }

        let obj = {
          assess: data.assessment,
          process: this.processData,
          scale: this.outcomeData,
          sustained: this.outcomeData2,
          ghgValue: data.ghgValue,
        }

        this.allData.push(obj);
      }


      for (let assessment of this.allData) {

        const data: any = assessment.scale[1]

        const averages: any = {};

        data.characteristics.forEach((obj: { name: string; score: any; }) => {
          if (obj.name in averages) {
            averages[obj.name].score += obj.score || 0;
            averages[obj.name].count++;
          } else {
            averages[obj.name] = {
              score: obj.score || 0,
              count: 1
            };
          }
        });

        const result = [];

        for (const name in averages) {
          const averageScaleScore = averages[name].score / averages[name].count;

          result.push({
            score: floorToHalf(averageScaleScore),
            name: name
          });
        }

        const data2: any = assessment.sustained[1]

        const averages2: any = {};

        data2.characteristics.forEach((obj: { name: string; score: any; }) => {
          if (obj.name in averages2) {
            averages2[obj.name].score += obj.score || 0;
            averages2[obj.name].count++;
          } else {
            averages2[obj.name] = {
              score: obj.score || 0,
              count: 1
            };
          }
        });

        const result2 = [];

        for (const name in averages2) {
          const averageSustainedScore2 = averages2[name].score / averages2[name].count;

          result2.push({
            score: floorToHalf(averageSustainedScore2),
            name: name
          });
        }

        assessment.scale[1].characteristics = [];
        assessment.scale[1].characteristics = result;
        assessment.sustained[1].characteristics = [];
        assessment.sustained[1].characteristics = result2;

      }




    });


    this.portfolioServiceProxy.getPortfolioById(this.portfolioId).subscribe(async (res: any) => {
      this.portfolio = res[0];

      await this.portfolioServiceProxy.assessmentsDataByAssessmentId(this.portfolioId).subscribe(async (res5: any) => {

        this.noOfAssessments = res5.length;



        this.card.push(
          ...[
            { title: 'Portfolio ID', data: this.portfolio.portfolioId },
            { title: 'Name of the portfolio', data: this.portfolio.portfolioName },
            { title: 'Description', data: this.portfolio.description },
            { title: 'Is this assessment an update of a previous assessment?', data: res[0].IsPreviousAssessment },
            { title: 'Objective(s) of the assessment', data: this.portfolio.objectives },
            { title: 'Intended audience(s) of the assessment', data: this.portfolio.audience },
            { title: 'Number of assessments', data: await this.noOfAssessments }
          ])
      });

    });

  }

  calculateAverage(data: any[]) {
    const sum = data.reduce((accumulator, item) => accumulator + parseFloat(item.likelihoodAverage), 0);
    const average = sum / data.length;
    return floorToHalf(average);
  }

  calculateAverageRelevance(data: any[]) {
    const sum = data.reduce((accumulator, item) => accumulator + parseFloat(item.relevanceAverage), 0);
    const average = sum / data.length;
    return floorToHalf(average);
  }

  calculateAverageScale(data: any[]) {
    const sum = data.reduce((accumulator, item) => accumulator + parseFloat(item.scoreAverage), 0);
    const average = sum / data.length;
    return floorToHalf(average);
  }

  calculateAverageSustained(data: any[]) {
    const sum = data.reduce((accumulator, item) => accumulator + parseFloat(item.scoreAverage), 0);
    const average = sum / data.length;
    return floorToHalf(average);
  }

  private colorBand(value: any): number {
    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? NaN : Math.floor(numericValue);
  }

  getColorClass(value: any) {
    let value2 = this.colorBand(value)
    if (value2 == 0) {
      return 'color-class-1';
    } else if (value2 == 1) {
      return 'color-class-2';
    } else if (value2 == 2) {
      return 'color-class-3';
    } else {
      return 'default-color-class';
    }
  }

  getColorClass2(value: any) {
    let value2 = this.colorBand(value)
    if (value2 == 0) {
      return 'color-class-21';
    } else if (value2 == 1) {
      return 'color-class-22';
    } else if (value2 == 2) {
      return 'color-class-23';
    }
    else if (value2 == 3) {
      return 'color-class-24';
    }
    else if (value2 == 4) {
      return 'color-class-25';
    }
    else {
      return 'default-color-class';
    }
  }

  getColorClass3(value: any) {
    let value2 = this.colorBand(value)
    if (value2 == -1) {
      return 'color-class-31';
    } else if (value2 == 0) {
      return 'color-class-32';
    } else if (value2 == 1) {
      return 'color-class-33';
    }
    else if (value2 == 2) {
      return 'color-class-34';
    }
    else if (value2 == 3) {
      return 'color-class-35';
    }
    else {
      return 'default-color-class';
    }
  }

  clickData: any = [];
  clickData2: any = [];
  clickData3: any = [];
  clickData4: any = [];

  handleClick(cha: any) {
    this.clickData = cha;
    this.tableShow = true;
  }

  handleClick2(cha: any) {
    this.clickData2 = cha;
    this.tableShow2 = true;
  }

  handleClick3(cha: any) {
    this.clickData3 = cha;
    this.tableShow3 = true;
  }

  handleClick4(cha: any) {
    this.clickData4 = cha;
    this.tableShow4 = true;
  }


  public async showTable() {
    this.tableShow = false;
  }

  public async showTable2() {
    this.tableShow2 = false;
  }

  public async showTable3() {
    this.tableShow3 = false;
  }

  public async showTable4() {
    this.tableShow4 = false;
  }


  makePDF() {

    var data = document.getElementById('content')!;

    html2canvas(data).then((canvas) => {
      const componentWidth = data.offsetWidth
      const componentHeight = data.offsetHeight

      const orientation = componentWidth >= componentHeight ? 'l' : 'p'

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation,
        unit: 'px'
      })

      pdf.internal.pageSize.width = componentWidth
      pdf.internal.pageSize.height = componentHeight

      pdf.addImage(imgData, 'PNG', 0, 0, componentWidth, componentHeight)
      pdf.save('portfolio-result.pdf')
    })

  }


  Back() {
    this.router.navigate(['/app/portfolio-list'],);
  }
}
