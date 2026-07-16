import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ClimateAction, CreateReportDto, InvestorToolControllerServiceProxy, MethodologyAssessmentControllerServiceProxy, ReportControllerServiceProxy } from 'shared/service-proxies/service-proxies';
import { DatePipe } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { jsPDF } from "jspdf"
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx-js-style';
import { MasterDataService } from 'app/shared/master-data.service';
import { ColorMap } from 'app/Tool/carbon-market/cm-result/cm-result.component';
import { HeatMapScore } from 'app/charts/heat-map/heat-map.component';
import { scoresMatchMatrixCell } from 'app/shared/score-rounding.util';
import { MessageService } from 'primeng/api';
import { environment } from 'environments/environment';
import { openAuthenticatedReport } from 'app/shared/authenticated-download.util';


@Component({
  selector: 'app-assessment-result-investor',
  templateUrl: './assessment-result-investor.component.html',
  styleUrls: ['./assessment-result-investor.component.css']
})
export class AssessmentResultInvestorComponent implements OnInit {

  @ViewChild('content', { static: false }) el!: ElementRef;
  @ViewChild('content') content: ElementRef;
  SERVER_URL = environment.baseUrlAPI;
  title = "Angular CLI and isPDF"
  assessmentId: number
  averageProcess: number
  averageOutcome: number
  reportName: string;
  assessmentData: any = []
  assessmentParameters: any = []
  display:boolean 
  impactCoverList: any = []
  sectorList: any = []
  levelofImplementation: string
  areaCovered: string
  levelofImplemetation: string
  geographicalAreasCovered: string
  meth1Process: any = []
  meth1Outcomes: any = []
  categoryDataArray: any = []
  categoryDataArrayOutcome: any = []

  policyName: string
  assessmentType: string
  date1: any
  date2: any
  barriersList: any = []
  tool: string
  assessment_approach: string
  assessment_method: string
  filteredData: any = []
  barriersData: any = []

  processCategory: any = []
  outcomeCategory: any = []
  characteristicsList: any = []
  assessategory: any = []
  load: boolean

  investerTool: boolean;
  loadTitle: boolean = false;
  title2: string;

  SDGsList : any = [];
  card: any = []
 
  intervention:ClimateAction;
  principles: string;
  opportunities:string;
  xData: {label: string; value: number}[];
  yData: {label: string; value: number}[];
  processData: any[] = []
  outcomeData: any[] = []
  processScore: number;
  outcomeScore: number;
  scale_GHGs: any;
  sustained_GHGs:any;
  sustained_SD:any;
  scale_SD: any;
  scale_adaptation: any;
  sustained_adaptation: any;
  aggregated_score:any
  loading: boolean = false;
  heatMapScore: HeatMapScore[];
  geographicalAreasList: any;
  sdgListWithScores:any[]=[]

  constructor(private route: ActivatedRoute,
    private methassess: MethodologyAssessmentControllerServiceProxy,
    private datePipe: DatePipe,
    private sanitizer: DomSanitizer,
    private investorToolControllerproxy: InvestorToolControllerServiceProxy,
    public masterDataService: MasterDataService,
    private reportControllerServiceProxy: ReportControllerServiceProxy,
    private messageService: MessageService,
    private http: HttpClient,

  ) { }
  ngOnInit(): void {

    this.investerTool = true;
    this.loadTitle = false;
    this.route.queryParams.subscribe(params => {
      this.assessmentId = params['assessmentId'];
      this.averageProcess = params['averageProcess'];
      this.averageOutcome = params['averageOutcome'];
    });
    this.xData = this.masterDataService.xData
    this.yData = this.masterDataService.yData

    this.investorToolControllerproxy.calculateFinalResults(this.assessmentId).subscribe((res: any) => {
      this.processData = res?.processData;
      this.outcomeData = res?.outcomeData;
      this.outcomeScore = res?.outcomeScore;
      this.processScore = res?.processScore;
      this.scale_GHGs = res?.outcomeData.find((item: { code: string; })=>item?.code=='SCALE_GHG')
      this.scale_SD = res?.outcomeData.find((item: { code: string; })=>item?.code=='SCALE_SD')
      this.sustained_GHGs = res?.outcomeData.find((item: { code: string; })=>item?.code=='SUSTAINED_GHG')
      this.sustained_SD = res?.outcomeData.find((item: { code: string; })=>item?.code=='SUSTAINED_SD')
      this.scale_adaptation = res?.outcomeData.find((item: { code: string; })=>item?.code=='SCALE_ADAPTATION')
      this.sustained_adaptation = res?.outcomeData.find((item: { code: string; })=>item?.code=='SUSTAINED_ADAPTATION')
      this.aggregated_score = res?.aggregatedScore;
      this.sdgListWithScores = res?.sdgListwithScores;
      this.heatMapScore = [{processScore: this.processScore, outcomeScore: this.outcomeScore}]
      this.loading=true 
    });


    this.methassess.assessmentData(this.assessmentId).subscribe((res: any) => {
      for (let x of res) {
        this.intervention = x.climateAction
        this.assessmentType = x.assessmentType
        this.date1 = x.from
        this.date2 = x.to
        this.tool = x.tool
        this.assessment_approach = x.assessment_approach
        this.assessment_method = x.assessment_method
        this.principles = x.principles
        this.opportunities = x.opportunities
        this.assessment_method = x.assessment_method
        
      }
      if (this.tool === 'PORTFOLIO') {
        this.investerTool = false;
        this.loadTitle = true;
        this.title2 ='Assessment results'
      }
      else if (this.tool === 'INVESTOR') {
        this.investerTool = true;
        this.loadTitle = true;
        this.title2 ='Assessment results'
      }

    });
   


    this.investorToolControllerproxy.getResultByAssessment(this.assessmentId).subscribe((res: any) => {
      this.tool = res.assessment.tool

    });

    this.investorToolControllerproxy.findAllSectorData(this.assessmentId).subscribe((res: any) => {
      for (let x of res) {
        this.sectorList.push(x.sector.name);
      }
    });

    this.investorToolControllerproxy.findAllGeographicalAreaData(this.assessmentId).subscribe((res: any) => {
        this.geographicalAreasList = res;
        this.geographicalAreasCovered = this.geographicalAreasList.map((a: any) => a.name).join(',');
    });

    setTimeout(() => {
      this.loadCardDetails();
      this.load = true;

    }, 1000);


  }

  loadCardDetails () {
    this.card = []
    this.card.push(
      ...[
        { title: 'Intervention ID', data: (this.intervention.intervention_id)?(this.intervention.intervention_id):'-' },
        { title: 'Intervention Type', data: (this.intervention.typeofAction)?(this.intervention.typeofAction):'-' },
        { title: 'Intervention Status', data: (this.intervention.projectStatus)?(this.intervention.projectStatus.name):'-' },
        { title: 'Assessment Type', data: this.assessmentType },
        { title: 'Geographical Area Covered', data: this.geographicalAreasList?.map((a: any) => a.name).join(', ') },
        { title: 'Sectors Covered', data: this.sectorList.join(', ') },
        { title: 'From', data: this.datePipe.transform(this.date1, 'dd/MM/yyyy') },
        { title: 'To', data: this.datePipe.transform(this.date2, 'dd/MM/yyyy') },
        { title: 'Opportunities for stakeholders to participate in the assessment', data: (this.opportunities)?(this.opportunities):'-' },

      ])
  }

  getBackgroundColor(x: number, y: number): string {
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

  getIntervention(x:number, y: number){
    if (
      this.processScore != null &&
      this.outcomeScore != null &&
      scoresMatchMatrixCell(this.processScore, this.outcomeScore, y, x)
    ) {
      return true
    } else {
      return false
    }
  }

  exportToExcel() {
    let colorMap = this.createColorMap();
    this.loadCardDetails();
    let book_name = 'Results - ' + this.intervention.policyName;

    const workbook = XLSX.utils.book_new();

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.card, { skipHeader: true });
    let table = document.getElementById('allTables');
    let worksheet = XLSX.utils.table_to_sheet(table, {});

    let heatmap = XLSX.utils.table_to_sheet(document.getElementById('heatmap'), {});

    XLSX.utils.book_append_sheet(workbook, ws, 'Assessment Info');
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Assessment Results');
    XLSX.utils.book_append_sheet(workbook, heatmap, 'Heat map');


    for (const itm of colorMap) {
      if (heatmap[itm.cell]) {
        heatmap[itm.cell].s = {
          fill: { fgColor: { rgb: itm.color } },
          font: { color: { rgb: itm.color } }
        };
      }
    }

    XLSX.writeFile(workbook, book_name + ".xlsx");

  }
  createColorMap(){
    let colorMap = [];
    let cols = 'CDEFGHI';
    let rows = '34567';
    let col_values = [3,2,1,0,-1,-2,-3];
    let row_values = [4,3,2,1,0];
    for (let [idx,row] of row_values.entries()){
      for (let [index, col] of col_values.entries()){
        let hasScore = this.getIntervention(col, row)
        let obj = new ColorMap()
        obj.cell = cols[index] + rows[idx]
        obj.value = row + col
        obj.color = hasScore ? '0000ff' : this.getBackgroundColor(col, row).replace('#', '')
        colorMap.push(obj)
      }
    }
    return colorMap
  }



  makePDF() {

    var data = document.getElementById('content')!;

    html2canvas(data).then((canvas) => {
      const componentWidth = data.offsetWidth;
      const componentHeight = data.offsetHeight;

      const orientation = componentWidth >= componentHeight ? 'l' : 'p'

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation,
        unit: 'px'
      })

      pdf.internal.pageSize.width = componentWidth;
      pdf.internal.pageSize.height = componentHeight;

      pdf.addImage(imgData, 'PNG', 0, 0, componentWidth, componentHeight);
      pdf.save('assessment-result.pdf');
    })

  }
  confirm(){
    let body = new CreateReportDto()
    body.assessmentId = this.assessmentId
    body.tool = this.masterDataService.getToolName(this.tool)
    body.type = 'Result'
    body.climateAction = this.intervention
    body.reportName = this.reportName
    this.reportControllerServiceProxy.generateReport(body).subscribe(res => {
      if (res) {
    
        this.display = false
        setTimeout(async () => {
          try {
            await openAuthenticatedReport(this.http, this.SERVER_URL, res.id);
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Report generated successfully',
              closable: true,
            });
          } catch {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Report was generated but could not be opened',
              closable: true,
            });
          }
        }, 5000);
      }
    }, error => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to generate report',
        closable: true,
      })
    })
  }
  generate(){
    this.display = true;
  }

}
