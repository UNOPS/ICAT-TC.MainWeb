import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, Renderer2, ViewChild } from '@angular/core';
import { MasterDataService } from 'app/shared/master-data.service';
import { OverlayPanel } from 'primeng/overlaypanel';
import { LazyLoadEvent } from 'primeng/api';
import { Assessment, InvestorToolControllerServiceProxy, PortfolioControllerServiceProxy, ProjectControllerServiceProxy } from 'shared/service-proxies/service-proxies';
import decode from 'jwt-decode';
import { Chart, ChartType } from 'chart.js';
import { HeatMapScore, TableData } from 'app/charts/heat-map/heat-map.component';
import { scoresMatchMatrixCell } from 'app/shared/score-rounding.util';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
@Component({
  selector: 'app-all-too-dashbord',
  templateUrl: './all-too-dashbord.component.html',
  styleUrls: ['./all-too-dashbord.component.css']
})
export class AllTooDashbordComponent implements OnInit, AfterViewInit {
  calResults: any;

  @ViewChild('portfolioSDGsPieChart')
  canvasRefSDGsPieChart: ElementRef<HTMLCanvasElement>;
  @ViewChild('sourceDiv', { read: ElementRef }) sourceDiv: ElementRef;
  @ViewChild('targetDiv', { read: ElementRef }) targetDiv: ElementRef;
  targetDivHeight: any;

  @ViewChild('investmentSectorCountPieChart')
  canvasRefSectorCountPieChart: ElementRef<HTMLCanvasElement>;

  @ViewChild('op') op: OverlayPanel;
  loading: boolean;
  totalRecords: number;
  pointTableDatas: Assessment[] = []
  userRole: string = "";
  policies: any;
  selectPolicy: any;
  countryId: number;

  sectorCount: {
    sector: string,
    count: number
  }[];

  portfolioSDGsPieChart: Chart;
  pieChart2: Chart;
  tool: string;
  tableData: any[] = []
  projectName: any[] = []
  xData: { label: string; value: number }[]
  yData: { label: string; value: number }[]
  rows: number = 5;
  sdgDetailsList: any = [];
  heatMapScore: HeatMapScore[];
  heatMapData: TableData[];

  secbgColors: string[] = [];
  sectorColorMap: { id: number; sectorNumber: number; color: string; }[]

  sdgColorMap: any;
  bgColors: any = []
  defaulColors = [
    'rgba(153, 102, 255, 1)',
    'rgba(75, 192, 192,1)',
    'rgba(54, 162, 235, 1)',
    'rgba(123, 122, 125, 1)',
    'rgba(255, 99, 132, 1)',
    'rgba(255, 205, 86, 1)',
    'rgba(70, 51, 102, 1)',
    'rgba(40, 102, 102, 1)',
    'rgba(27, 74, 107, 1)',
    'rgba(75, 74, 77, 1)',
    'rgba(121, 27, 53, 1)',
    'rgba(121, 98, 20, 1)',
    'rgba(51, 0, 51, 1)',
    'rgba(25, 25, 112, 1)',
    'rgba(139, 0, 0, 1)',
    'rgba(0, 0, 139, 1)',
    'rgba(47, 79, 79, 1)',
    'rgba(139, 69, 19, 1)'
  ]
  selectedPortfolio: any;
  portfolioList: any[] = [];
  allAssessments: any[] = [];
  selectedAssessments: any[] = [];
  selectedIds: string[] = [];
  selectionLimit: number = 10;

  constructor(
    private investorProxy: InvestorToolControllerServiceProxy,
    public masterDataService: MasterDataService,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2,
    private projectProxy: ProjectControllerServiceProxy,
    private portfolioServiceProxy: PortfolioControllerServiceProxy,
    private activatedRoute: ActivatedRoute,
    private router: Router,
  ) {
  }
  ngOnInit(): void {
    const token = localStorage.getItem('ACCESS_TOKEN')!;
    const tokenPayload = decode<any>(token);
    this.userRole = tokenPayload.role.code;
    this.countryId = tokenPayload.countryId
    this.sdgColorMap = this.masterDataService.SDG_color_map
    this.sectorColorMap = this.masterDataService.Sector_color_map;
    this.getPortfolioList()
    this.setAlldata()

    setTimeout(() => {
      this.projectProxy
        .getProjectName(this.countryId)

        .subscribe((a) => {
          this.policies = a.filter((obj: any) => obj !== null);
        }, err => { this.loading = false; });
    }, 1000);

    this.xData = this.masterDataService.xData;
    this.yData = this.masterDataService.yData;
    let event: any = {};
    event.rows = this.rows;
    event.first = 0;
    this.loadgridData(event);
    this.sectorCountResult();

  }

  getPortfolioList() {
    this.portfolioServiceProxy.getAll().subscribe(async (res: any) => {
      this.portfolioList = res;
    });
  }

  goToFunction() {
    this.selectedPortfolio = ''
    this.selectPortfolio()
    this.setAlldata()
  }

  setAlldata() {
    let tool = 'ALL_OPTION'
    this.portfolioServiceProxy.getAlltoolDashboardData(this.selectedPortfolio ? this.selectedPortfolio.id : 0, 1, this.rows, this.selectedIds, tool).subscribe((res) => {
      if (res.meta.allData && res.meta.allData.length > 0) {
        this.allAssessments = this.mapOptionlable(res.meta.allData)
      }
    });
  }
  mapOptionlable(data: any[]) {
    return data.map(item => {
      let label: string = item.climateAction.policyName
      let id :number=item.id;
      if (item.from && item.to) {
        label = label + " - " + moment(new Date(item.from)).format("DD/MM/YYYY").toString() + " - " + moment(new Date(item.to)).format("DD/MM/YYYY").toString();
        
      }
      return { label: label,id:id }
    })
  }

  selectPortfolio() {
    this.sdgDetailsList = [];
    this.setAlldata()
    this.sectorCountResult()
    this.sdgResults()
    let event: any = {};
    event.rows = this.rows;
    event.first = 0;
    this.loadgridData(event);
  }


  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }
  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
  }

  sectorCountResult() {
    this.sectorCount = []
    this.investorProxy.findSectorCountAllTool(this.selectedPortfolio ? this.selectedPortfolio.id : 0).subscribe((res: any) => {
      this.sectorCount = res.sort(this.compareByAge);
      setTimeout(() => {
        this.viewSecterTargetedPieChart();
      }, 20);
      this.sdgResults()

    });
  }

  compareByAge(a: any, b: any) {
    return b.count - a.count;
  }
  viewSecterTargetedPieChart() {
    const labels = this.sectorCount.map((item) => item.sector);
    let counts: number[] = this.sectorCount.map((item) => item.count);
    const total = counts.reduce((acc, val) => acc + val, 0);
    const percentages = counts.map(count => ((count / total) * 100).toFixed(2));
    if (!this.canvasRefSectorCountPieChart) {
      return;
    }

    this.sectorCount.forEach((sd: any) => {
      let color = this.sectorColorMap.find(o => o.sectorNumber === sd.sector_id)
      if (color) {
        this.secbgColors.push(color.color)
      } else {
        this.secbgColors.push(this.defaulColors[sd.id])
      }
    })

    const canvas = this.canvasRefSectorCountPieChart.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    if (this.pieChart2) {
      this.pieChart2.destroy()
    }
    this.pieChart2 = new Chart(ctx, {
      type: 'pie' as ChartType,

      data: {
        labels: labels,
        datasets: [{
          data: counts,
          backgroundColor: this.secbgColors,

        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20
            }
          },
          datalabels: {
            color: '#fff',
            font: {
              size: 12
            },
            formatter: (value, ctx) => {
              const label = ctx.chart.data.labels![ctx.dataIndex];
              const percentage = percentages[ctx.dataIndex];
              return `${label}: ${value} (${percentage}%)`;
            },

          },
          tooltip: {
            position: 'average',
            boxWidth: 10,
            callbacks: {

              label: (ctx) => {
                let sum = 0;
                let array = counts
                array.forEach((number) => {
                  sum += Number(number);
                });
                let percentage = (counts[ctx.dataIndex] * 100 / sum).toFixed(2) + "%";

                return [
                  `Sector: ${labels[ctx.dataIndex]}`,
                  `Count: ${counts[ctx.dataIndex]}`,
                  `Percentage: ${percentage}`
                ];
              }
            },
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 14
            },
            displayColors: true,
            bodyAlign: 'left'
          }
        }

      },

    });

  }
  onSelectAssessment() {
    this.selectedIds = this.selectedAssessments.map((item: any) => item.id)
    this.projectName = this.selectedAssessments.map((item: any) => item.id)
    this.callTable()
  }

  onClear() {
    this.selectedIds = []
    this.selectedAssessments = []
    this.callTable()
    this.projectName = [];
    let event: any = {};
    event.rows = this.rows;
    event.first = 0;
    this.loadgridData(event);
  }

  callTable() {
    let event: any = {};
    event.rows = this.rows;
    event.first = 0;
    this.loadgridData(event);
  }

  loadgridData = (event: LazyLoadEvent) => {
    this.loading = true;
    this.totalRecords = 0;

    let pageNumber =
      event.first === 0 || event.first === undefined
        ? 1
        : event.first / (event.rows === undefined ? 1 : event.rows) + 1;
    this.rows = event.rows === undefined ? 10 : event.rows;
    let skip = pageNumber * this.rows;
    this.investorProxy.getDashboardAllDatafilter(pageNumber, this.rows, this.projectName, this.selectedPortfolio ? this.selectedPortfolio.id : 0).subscribe((res) => {
      this.tableData = res.items;
      this.heatMapScore = this.tableData.map(item => { return { processScore: item.result.averageProcess, outcomeScore: item.result.averageOutcome } })
      this.heatMapData = this.tableData.map(item => { return { interventionId: item.climateAction?.intervention_id, interventionName: item.climateAction?.policyName, processScore: item.result.averageProcess, outcomeScore: item.result.averageOutcome } })
      this.totalRecords = res.meta.totalItems
      this.loading = false;
    }, err => {
      this.loading = false;
    });




  };
  goToResult(id: number, tool: string) {
    if (tool == 'CARBON_MARKET') {
      this.router.navigate(['carbon-market-tool-result'], { queryParams: { id: id }, relativeTo: this.activatedRoute })
    } else {
      this.router.navigate(['assessment-result-investor', id], { queryParams: { assessmentId: id }, relativeTo: this.activatedRoute });
    }

  }

  mapOutcomeScores(value: number) {

    switch (value) {
      case -1:
        return 'Minor Negative';
      case -2:
        return 'Moderate Negative';
      case -3:
        return 'Major Negative';
      case 0:
        return 'None';
      case 1:
        return 'Minor';
      case 2:
        return 'Moderate';
      case 3:
        return 'Major';

      case null:
        return 'N/A'
      default:
        return 'N/A';

    }
  }

  mapProcessScores(value: number) {

    switch (value) {
      case 0:
        return 'Very unlikely (0-10%)';
      case 1:
        return 'Unlikely (10-30%)     ';
      case 2:
        return 'Possible (30-60%)';
      case 3:
        return 'Likely (60-90%)';
      case 4:
        return 'Very likely (90-100%)'
      case null:
        return 'N/A'
      default:
        return 'N/A';
    }
  }
  getBackgroundColor(value: number): string {
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
        return '#fcf084';
      case 3:
        return '#e0e885';
      case 4:
        return '#c1e083';
      case 5:
        return '#a3d481';
      case 6:
        return '#84cc80';
      case 7:
        return '#65c17e';
      default:
        return 'white';
    }
  }
  getDotColor(value: number): string {
    switch (value) {
      case -3:
        return '#004040';
      case -2:
        return '#00A0A0';
      case -1:
        return '#FFD700';
      case 0:
        return '#0080FF';
      case 1:
        return '#FF4136';
      case 2:
        return '#8000FF';
      case 3:
        return '#800000';
      case 4:
        return '#FF0000';
      case 5:
        return '#FF8000';
      case 6:
        return '#FFD700';
      case 7:
        return '#808000';
      default:
        return 'white';
    }
  }

  enterHeatMapPoint(x: number, y: number, event: any) {
    this.pointTableDatas = this.tableData.filter(item =>
      scoresMatchMatrixCell(item.process_score, item.outcome_score, y, x),
    )
    if (this.pointTableDatas.length > 0) {
      this.op.show(event);
    }
  }

  leaveHeatMapPoint() {
    this.pointTableDatas = [];
  }

  getIntervention(x: number, y: number) {
    return this.tableData.some(item =>
      scoresMatchMatrixCell(item.process_score, item.outcome_score, y, x),
    );
  }

  sdgResults() {
    this.sdgDetailsList = []
    this.investorProxy.sdgSumAllCalculate(this.selectedPortfolio ? this.selectedPortfolio.id : 0).subscribe(async (res: any) => {
      this.sdgDetailsList = res;
      setTimeout(() => {
        this.viewPortfolioSDGsPieChart();

      }, 200);
    });
  }

  viewPortfolioSDGsPieChart() {
    this.sdgDetailsList.sort((a: any, b: any) => b.count - a.count)
    let labels = this.sdgDetailsList.map((item: any) => item.number + ' - ' + item.sdg);
    let counts: number[] = this.sdgDetailsList.map((item: any) => item.count);
    this.sdgDetailsList.forEach((sd: any) => {
      let color = this.sdgColorMap.find((o: any) => o.sdgNumber === sd.number)
      if (color) {
        this.bgColors.push(color.color)
      } else {
        this.bgColors.push(this.defaulColors[sd.id])
      }
    })
    let total = counts.reduce((acc, val) => acc + val, 0);
    let percentages = counts.map(count => ((count / total) * 100).toFixed(2));

    if (!this.canvasRefSDGsPieChart) {
      return;
    }

    const canvas = this.canvasRefSDGsPieChart.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }
    if (this.portfolioSDGsPieChart) {
      this.portfolioSDGsPieChart.data.datasets[0].data = counts;
      this.portfolioSDGsPieChart.data.labels = labels
      this.portfolioSDGsPieChart.update();
    }
    else {
      this.portfolioSDGsPieChart = new Chart(ctx, {
        type: 'pie' as ChartType,

        data: {
          labels: labels,
          datasets: [{
            data: counts,
            backgroundColor: this.bgColors,

          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20
              }
            },
            datalabels: {
              color: '#fff',
              font: {
                size: 12
              },
              formatter: (value, ctx) => {
                const label = ctx.chart.data.labels![ctx.dataIndex];
                const percentage = percentages[ctx.dataIndex];
                return `${label}: ${value} (${percentage}%)`;
              },

            },
            tooltip: {
              position: 'average',
              boxWidth: 10,
              callbacks: {

                label: (ctx) => {

                  let sum = 0;
                  let array = ctx.dataset.data
                  array.forEach((number) => {
                    sum += Number(number);
                  });

                  let percentage = (ctx.parsed / sum * 100).toFixed(2) + "%";

                  return [
                    `SDG: ${ctx.label}`,
                    `Count: ${ctx.raw}`,
                    `Percentage: ${percentage}`
                  ];
                }
              },
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleFont: {
                size: 14,
                weight: 'bold'
              },
              bodyFont: {
                size: 14
              },
              displayColors: true,
              bodyAlign: 'left'
            }
          }

        },

      });
    }


  }

}
