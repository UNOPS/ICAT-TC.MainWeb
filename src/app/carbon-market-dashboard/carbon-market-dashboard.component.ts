import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Chart, ChartType } from 'chart.js';
import { AssessmentCMDetailControllerServiceProxy, CMAssessmentQuestionControllerServiceProxy, CMScoreDto, InvestorToolControllerServiceProxy,} from 'shared/service-proxies/service-proxies';
import decode from 'jwt-decode';
import { LoginRole, } from 'shared/AppService';
import { MasterDataService } from 'app/shared/master-data.service';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Paginator } from 'primeng/paginator';
import { LazyLoadEvent } from 'primeng/api';
import { OverlayPanel } from 'primeng/overlaypanel';
import { HeatMapScore, TableData } from 'app/charts/heat-map/heat-map.component';
import { scoresMatchMatrixCell } from 'app/shared/score-rounding.util';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
  selector: 'app-carbon-market-dashboard',
  templateUrl: './carbon-market-dashboard.component.html',
  styleUrls: ['./carbon-market-dashboard.component.css']
})
export class CarbonMarketDashboardComponent implements OnInit,AfterViewInit {
  @ViewChild('cmSDGsPieChart')
  canvascmRefSDGsPieChart: ElementRef<HTMLCanvasElement>;
  @ViewChild('sourceDiv', { read: ElementRef }) sourceDiv: ElementRef;
  @ViewChild('targetDiv', { read: ElementRef }) targetDiv: ElementRef;


  @ViewChild('cmSectorCountPieChart')
  canvascmRefSectorCountPieChart: ElementRef<HTMLCanvasElement>;

  @ViewChild('op') op: OverlayPanel;
  heatMapScore: HeatMapScore[];
  heatMapData: TableData[];
  targetDivHeight: any;
  sdgColorMap: {id: number; sdgNumber: number; color: string;}[]
  sectorColorMap: {id: number; sectorNumber: number; color: string;}[]
  bgColors: string[] = [];
  secbgColors : string[] = [];
  interventions_to_filter: any[] = [];
  selected_interventions: string[] = [];

  constructor(
    private assessmentCMProxy:AssessmentCMDetailControllerServiceProxy,
    private investorProxy: InvestorToolControllerServiceProxy,
    private cmAssessmentQuestionProxy : CMAssessmentQuestionControllerServiceProxy,
    public masterDataService: MasterDataService,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2,
    private activatedRoute: ActivatedRoute,
    private router: Router,
  ) { 
  }

 totalRecords: number = 0;
 score: CMScoreDto = new CMScoreDto()
 userName: string = "";
 userRole: string = "";
 loginRole = LoginRole;
  interventions:any
  tcData: {
    x:string,
    y:number,
    data:string,
  }[]=[];
  chart: any = [];

  tcTableData: {
    x:string,
    y:number,
    data:string,
  }[]=[];
  pointTableDatas:any[]=[]
  CMsectorCount: {
    sectoral_boundary:number
    average_tc_value:string,

    }[];

CMPrerequiste: {
  sector:string,
  count:number
  }[];

  sectorCount: {
    sector:string,
    count:number
    }[]=[];
    cmPieChartSDG:Chart;
    cmPieChartSectorCount:Chart;
  CMBarChart:any =[];
  pieChartCM:any=[];
  averageTCValue:any;

  tool : string;

  pieChart2:any=[];
  loading:boolean=false;
  tableData:any[]=[]
    xData: {label: string; value: number}[]
    yData: {label: string; value: number}[]
    rows: number = 5;
    slicedData:{
      assessment: number,
      process_score: number,
      outcome_score: number,
      intervention: string
    }[]=[];
    sdgDetailsList:any=[];
    defaulColors =[
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
  ngOnInit(): void {
    const token = localStorage.getItem('ACCESS_TOKEN')!;
    const tokenPayload = decode<any>(token);
    this.userRole = tokenPayload.role.code;

    this.sdgColorMap = this.masterDataService.SDG_color_map;
    this.sectorColorMap = this.masterDataService.Sector_color_map

    this.tool = 'CARBON_MARKET';
    let event: any = {};
    event.rows = this.rows;
    event.first = 0;

    this.loadgridData(event);
   

    this.xData = this.masterDataService.xData;
    this.yData = this.masterDataService.yData;
    this.assessmentCMProxy.getPrerequisite().subscribe((res:any)=>{

      this.CMPrerequiste=res
      setTimeout(() => {
        this.viewPieChartCM();
      }, 20);
      
    })

    this.sectorCountResult();

  }

  loadgridData = (event: LazyLoadEvent) => {
    this.loading = true
    
    this.totalRecords = 0;
    let pageNumber =
      event.first === 0 || event.first === undefined
        ? 1
        : event.first / (event.rows === undefined ? 1 : event.rows) + 1;
    this.rows = event.rows === undefined ? 5 : event.rows;
    this.cmAssessmentQuestionProxy.getDashboardData(pageNumber,this.rows, this.selected_interventions).subscribe((res_) => {
      let res = res_.assessments
      this.tableData=res.items;
      this.interventions_to_filter = res_.interventions
      this.loading = false;
      this.heatMapScore = this.tableData.map(item => {return {processScore: item.process_score, outcomeScore: item.outcome_score}});
      this.heatMapData = this.tableData.map(item => {return {interventionId: item.intervention_id, interventionName: item.intervention, processScore: item.process_score, outcomeScore: item.outcome_score}}) 
      
      this.totalRecords= res.meta.totalItems;
    }, err => {
      this.loading = false;});

  };

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
  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }
  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.updateSourceDivHeight();
  }

  updateSourceDivHeight(): void {
    this.targetDivHeight = this.targetDiv.nativeElement.offsetHeight;
    this.renderer.setStyle(this.sourceDiv.nativeElement, 'height', `${this.targetDivHeight}px`);
    this.renderer.setStyle(this.sourceDiv.nativeElement, 'overflow-y', 'auto');
    this.cdr.detectChanges();
  }

  sdgResults(){
    this.sdgDetailsList=[]
    this.investorProxy.sdgSumCalculate('CARBON_MARKET').subscribe(async (res: any) => {
      this.sdgDetailsList = res;
      setTimeout(() => {
        this.viewFrequencyofSDGsChart();
        
      }, 200);
     });
    

  
   
    
  }
sectorCountResult(){
 this.investorProxy.getSectorCountByTool(this.tool).subscribe((res: any) => {
      this.sectorCount = res.sort(this.compareByAge);
      setTimeout(() => {
       
        this.viewSecterTargetedPieChart();
        this.updateSourceDivHeight();
      }, 20);
      
      this.sdgResults();
     
    });
;
}
  viewFrequencyofSDGsChart(){
    this.sdgDetailsList.sort((a: any, b: any) => b.count - a.count)
    let labels = this.sdgDetailsList.map((item:any) => item.number + ' - ' + item.sdg);
    let counts:number[] = this.sdgDetailsList.map((item:any) => item.count);
    this.sdgDetailsList.forEach((sd: any) => {
      let color = this.sdgColorMap.find(o => o.sdgNumber === sd.number)
      if (color) {
        this.bgColors.push(color.color)
      } else {
        this.bgColors.push(this.defaulColors[sd.id])
      }
    })
    let total = counts.reduce((acc, val) => acc + val, 0);
    let percentages = counts.map(count => ((count / total) * 100).toFixed(2));


    if (!this.canvascmRefSDGsPieChart) {;
      return;
    }

    const canvas = this.canvascmRefSDGsPieChart.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) {;
      return;
    }

    if (this.cmPieChartSDG) {;
      this.cmPieChartSDG.data.datasets[0].data = counts;
      this.cmPieChartSDG.data.labels=labels
      this.cmPieChartSDG.update();
    }
    else{


    this.cmPieChartSDG =new Chart(ctx, {
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
        plugins:{
          legend:{
            position: 'bottom',
            labels: {
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
          tooltip:{
            position:'average',
            boxWidth:10,
            callbacks:{
              
              label:(ctx)=>{ 
                let sum = 0;
                let array =counts
                array.forEach((number) => {
                  sum += Number(number);
                });
                let percentage = (counts[ctx.dataIndex]*100 / sum).toFixed(2)+"%";

                return[
                  `SDG: ${labels[ctx.dataIndex]}`,
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

  });}

  }
  viewSecterTargetedPieChart(){
    const labels = this.sectorCount.map((item) => item.sector);
    let counts:number[] = this.sectorCount.map((item) => item.count);
    const total = counts.reduce((acc, val) => acc + val, 0);
    const percentages = counts.map(count => ((count / total) * 100).toFixed(2));
    this.sectorCount.forEach((sd: any) => {
      let color = this.sectorColorMap.find(o => o.sectorNumber === sd.id)
      if (color) {
        this.secbgColors.push(color.color)
      } else {
        this.secbgColors.push(this.defaulColors[sd.id])
      }
    })
    if (!this.canvascmRefSectorCountPieChart) {
      return;
    }

    const canvas = this.canvascmRefSectorCountPieChart.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    if (this.cmPieChartSectorCount) {
      this.cmPieChartSectorCount.data.datasets[0].data = counts;
      this.cmPieChartSectorCount.data.labels=labels
      this.cmPieChartSectorCount.update();
    }
    else{
    this.cmPieChartSectorCount =new Chart(ctx, {
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
        
        plugins:{
          legend:{
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
          tooltip:{
            position:'average',
            boxWidth:10,
            callbacks:{
              
              label:(ctx)=>{ 
                let sum = 0;
                let array =counts
                array.forEach((number) => {
                  sum += Number(number);
                });
                let percentage = (counts[ctx.dataIndex]*100 / sum).toFixed(2)+"%";

                return[
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

  });}

  }
  getRandomColors(count: number): string[] {
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
      colors.push(randomColor);
    }
    return colors;
  }



  viewPieChartCM(){
    const labels = this.CMPrerequiste.map((item) => item.sector);
    let counts:number[] = this.CMPrerequiste.map((item) => item.count);
    const total = counts.reduce((acc, val) => acc + val, 0);
    const percentages = counts.map(count => ((count / total) * 100).toFixed(2));
    this.pieChartCM =new Chart('pieChartCM', {
      type: 'pie',

      data: {
        labels: labels,
        datasets: [{
          data: counts,
          backgroundColor: ['rgba(153, 102, 255, 1)','black'],
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        
        plugins:{
          legend:{
            position: 'bottom',
            labels: {
              padding: 20
            }
          },
          datalabels: {
            display: true,
            align: 'bottom',
            color:'#fff',
            font: {
              size: 12,
            },
            formatter: (value, ctx) => {
              const label = ctx.chart.data.labels![ctx.dataIndex];
              const percentage = ((value / counts.reduce((a, b) => a + b, 0)) * 100).toFixed(2) + "%";
              return percentage;
            },
          },
          tooltip:{
            position:'average',
            boxWidth:10,
            callbacks:{

              label:(ctx)=>{
                let sum = 0;
                let array =counts
                array.forEach((number) => {
                  sum += Number(number);
                });
                let percentage = (counts[ctx.dataIndex]*100 / sum).toFixed(2)+"%";

                return[
                  ` ${labels[ctx.dataIndex]}`,
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
      plugins:[ChartDataLabels]

  });

  }
  getBackgroundColor(value: number): string {
    switch (value) {
      case -3:
        return '#e5233d';
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

  getIntervention(p:number, q: number){
    return this.tableData.some(item =>
      scoresMatchMatrixCell(item.process_score, item.outcome_score, q, p),
    );
  }
  paginate(event:Paginator|undefined) {
    if (event){
      this.slicedData = this.tableData.slice(event?.first,event?.first+this.rows)
    }
    else{
      this.slicedData = this.tableData.slice(0,this.rows)
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
  enterHeatMapPoint(x:number, y: number,event:any){

 
    this.pointTableDatas=this.tableData.filter(item=>
      scoresMatchMatrixCell(item.process_score, item.outcome_score, y, x),
    )
    if(this.pointTableDatas.length>0){
      this.op.show(event);
    }

  }
  leaveHeatMapPoint(){
 
     this.pointTableDatas=[];

  }
  compareByAge(a:any, b:any) {
    return b.count - a.count;
  }

  goToResult(id: number) {
    this.router.navigate(['carbon-market-tool-result'], { queryParams: { id: id }, relativeTo: this.activatedRoute })
  }
  
}
