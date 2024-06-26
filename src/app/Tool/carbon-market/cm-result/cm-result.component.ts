import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Assessment, AssessmentCMDetail, AssessmentCMDetailControllerServiceProxy, AssessmentControllerServiceProxy, CMAssessmentQuestionControllerServiceProxy, CMScoreDto, CalculateDto, Characteristics, ClimateAction, CreateReportDto, ReportControllerServiceProxy, ScoreDto } from 'shared/service-proxies/service-proxies';
import * as XLSX from 'xlsx-js-style';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { MasterDataDto, MasterDataService } from 'app/shared/master-data.service';
import { environment } from 'environments/environment';
import { SDG } from '../cm-section-three/cm-section-three.component';
import { HeatMapScore } from 'app/charts/heat-map/heat-map.component';
import * as moment from 'moment';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-cm-result',
  templateUrl: './cm-result.component.html',
  styleUrls: ['./cm-result.component.css']
})
export class CmResultComponent implements OnInit {
  SERVER_URL = environment.baseUrlAPI;
  assessment: Assessment
  assessmentCMDetail: AssessmentCMDetail
  intervention: ClimateAction
  card: any[] = []
  results: any;
  criterias: any;
  sections: string[]
  score: CMScoreDto = new CMScoreDto()
  expandedRows: any = {}
  isDownloading: boolean = false
  processData:any = {};
  outcomeData: { scale_GHGs: any[], sustained_GHGs: any[], scale_SDs: any[], sustained_SDs: any[], scale_adaptation: any[], sustained_adaptation: any[] } = { scale_GHGs: [], sustained_GHGs: [], scale_SDs: [], sustained_SDs: [], scale_adaptation:[], sustained_adaptation: [] };
  fileServerURL:any
  SDGs: SDG[]
  scale_GHG_score_macro: ScoreDto[]
  scale_GHG_score_medium: ScoreDto[]
  scale_GHG_score_micro: ScoreDto[]
  sustained_GHG_score: ScoreDto[]
  scale_SD_score: ScoreDto[]
  sustained_SD_score: ScoreDto[]
  relevances: any

  xData: {label: string; value: number}[]
  yData: {label: string; value: number}[]
  heatMapScore: HeatMapScore[]
  scales: MasterDataDto[];
  selectedSdgs: any;
  display:boolean 
  reportName: string;
  constructor(
    private route: ActivatedRoute,
    private assessmentControllerServiceProxy: AssessmentControllerServiceProxy,
    private assessmentCMDetailControllerServiceProxy: AssessmentCMDetailControllerServiceProxy,
    private cMAssessmentQuestionControllerServiceProxy: CMAssessmentQuestionControllerServiceProxy,
    public masterDataService: MasterDataService,
    private reportControllerServiceProxy: ReportControllerServiceProxy,
    private messageService: MessageService
  ) { }

  async ngOnInit(): Promise<void> {
    this.fileServerURL = environment.baseUrlAPI+'/document/downloadDocumentsFromFileName/uploads'
    this.route.queryParams.subscribe(async (params) => {
      let assessmentId = params['id']
      this.assessment = await this.assessmentControllerServiceProxy.findOne(assessmentId).toPromise()
      this.intervention = this.assessment.climateAction
      let cmApproaches = this.masterDataService.int_cm_approaches
      this.SDGs = this.masterDataService.SDGs
      this.scale_GHG_score_macro=this.masterDataService.GHG_scale_score_macro;
      this.scale_GHG_score_medium=this.masterDataService.GHG_scale_score_medium;
      this.scale_GHG_score_micro=this.masterDataService.GHG_scale_score_micro;
      this.sustained_GHG_score=this.masterDataService.GHG_sustained_score;
      this.scale_SD_score =this.masterDataService.SDG_scale_score;
      this.sustained_SD_score=this.masterDataService.SDG_sustained_score;
      this.relevances = this.masterDataService.relevance
      this.xData = this.masterDataService.xData
      this.yData = this.masterDataService.yData
      this.scales = this.masterDataService.scale_of_activity

      this.assessmentCMDetail = await this.assessmentCMDetailControllerServiceProxy.getAssessmentCMDetailByAssessmentId(assessmentId).toPromise()
      let cmApproache = cmApproaches.find(o => o.code === this.assessmentCMDetail.intCMApproach)
      let scale = this.scales.find(o => o.code === this.assessmentCMDetail.scale)

      this.card.push(
        ...[
          { title: 'Intervention', data: this.intervention.policyName },
          { title: 'Scale of activity', data: scale?.name },
          { title: 'Assessment type', data: this.assessment.assessmentType },
          { title: 'Geographical areas covered', data: this.assessmentCMDetail.geographicalAreasCovered.map(a => a.name).join(', ')},
          { title: 'Sectors covered', data: this.assessmentCMDetail.sectorsCovered.map(a => a.sector.name).join(', ')},
          { title: 'Opportunities for stakeholders to participate in the assessment', data: this.assessment.opportunities},
          { title: 'Assessment period', data: moment(this.assessment.from).format('DD/MM/YYYY') + ' - ' + moment(this.assessment.to).format('DD/MM/YYYY')},
          { title: 'Assessment boundaries (If different from the intervention boundary specified in the baseline methodology)', data: this.assessmentCMDetail.boundraries},
          { title: 'International carbon market approach used', data: cmApproache?.name},
          { title: 'Baseline and monitoring methodology applied by the intervention', data: this.assessmentCMDetail.appliedMethodology}
        ])
      await this.getResult()
      this.criterias.forEach((c: any) => {
        this.expandedRows[c] = true
      })
    })

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

  getIntervention(x:number, y: number){
    if (this.score.process_score === y && this.score.outcome_score.outcome_score === x){
      return true
    } else {
      return false
    }
  }

  async getResult() {
    let res = await this.cMAssessmentQuestionControllerServiceProxy.getResults(this.assessment.id).toPromise()
    if (res){
      this.results = res.result
      this.criterias = res.criteria
      this.processData =res.processData;
      this.outcomeData =res.outComeData;
      this.sections = Object.keys(this.results)
      this.sections = this.sections.filter(e => e !== "undefined")
      this.selectedSdgs = res.sdgs

      this.criterias.forEach((c: any) => {
        this.expandedRows[c] = false
      })

      let req = new CalculateDto()
      req.assessmentId = this.assessment.id

      let response = await this.cMAssessmentQuestionControllerServiceProxy.calculateResult(req).toPromise()
      this.score = response
      this.heatMapScore = [{ processScore: this.score.process_score, outcomeScore: this.score.outcome_score.outcome_score }]
      if (response?.outcome_score?.sdgs_score) {
        Object.keys(response.outcome_score.sdgs_score)?.map((key: any) => {
          this.selectedSdgs = this.selectedSdgs.map((sd: any) => {
            if (+key === sd.id) {
              sd['score'] = response.outcome_score.sdgs_score[key]
            }
            return sd
          })
        })
      }
    }
  }

  createColorMap(){
    let colorMap = []
    let cols = 'CDEFGHI'
    let rows = '34567'
    let col_values = [3,2,1,0,-1,-2,-3]
    let row_values = [4,3,2,1,0]
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

  toDownloadExcel() {
    let colorMap = this.createColorMap()
    this.isDownloading = true
    setTimeout(() =>{
      let book_name = 'Results - ' + this.intervention.policyName
  
      const workbook = XLSX.utils.book_new();
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.card, { skipHeader: true });
      let table = document.getElementById('cmtool')
      let worksheet = XLSX.utils.table_to_sheet(table,{})
      this.isDownloading = false
      setTimeout(() => {
        XLSX.utils.book_append_sheet(workbook, ws, 'Assessment Info');
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Assessment Results');
        let doc = document.getElementById('heatmap')
        let heatmap
        if (doc){ 
          heatmap = XLSX.utils.table_to_sheet(doc,{})
          XLSX.utils.book_append_sheet(workbook, heatmap, 'Score map');
          for (const itm of colorMap) {
            if (heatmap[itm.cell]) {
              heatmap[itm.cell].s = {
                fill: { fgColor: { rgb: itm.color } },
                font: { color: { rgb: itm.color } }
              };
            }
          }
        }

        XLSX.writeFile(workbook, book_name + ".xlsx", {cellStyles: true});
      }, 1000);
      this.isDownloading = false
    }, 1000)
  }

  _toDownloadExcel(){ 
    let length = 0
    let book_name = 'Results - ' + this.intervention.policyName
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.card, { skipHeader: true });
    const wb: XLSX.WorkBook = XLSX.utils.book_new();

    length = length + this.card.length + 2

    this.sections.forEach(section => {
      XLSX.utils.sheet_add_json(ws, [{section: section}], { skipHeader: true, origin: "A" + length });
      length = length + 2
      XLSX.utils.sheet_add_json(ws, this.results[section], { skipHeader: false, origin: "A" + length });
      length = length + this.results[section].length + 2
    })
    XLSX.utils.sheet_add_json(ws, [{title: 'Transformational change criteria'}], { skipHeader: true, origin: "A" + length });
    length = length + 2

    let processData =  this._mapProcessData()

    if (processData.technology && processData.technology.length!=0){
      XLSX.utils.sheet_add_json(ws, [{title: 'Process of change / Technology'}], { skipHeader: true, origin: "A" + length });
      length = length + 2
      XLSX.utils.sheet_add_json(ws, processData.technology, { skipHeader: false, origin: "A" + length });
      length = length + this.processData.technology.length + 2
    }
    if (processData.incentives && processData.incentives.length!=0){
      XLSX.utils.sheet_add_json(ws, [{title: 'Process of change / Incentives'}], { skipHeader: true, origin: "A" + length });
      length = length + 2
      XLSX.utils.sheet_add_json(ws, processData.incentives, { skipHeader: false, origin: "A" + length });
      length = length + this.processData.incentives.length + 2
    }
    if (processData.norms && processData.norms.length!=0){
      XLSX.utils.sheet_add_json(ws, [{title: 'Process of change / Norms'}], { skipHeader: true, origin: "A" + length });
      length = length + 2
      XLSX.utils.sheet_add_json(ws, processData.norms, { skipHeader: false, origin: "A" + length });
      length = length + this.processData.norms.length + 2
    }

    let outcomeData = this.mapOutcomeData()
    if (outcomeData.scaleGHGs && outcomeData.scaleGHGs.length!=0){
      XLSX.utils.sheet_add_json(ws, [{title: 'Outcome of change / Scale GHGs'}], { skipHeader: true, origin: "A" + length });
      length = length + 2
      XLSX.utils.sheet_add_json(ws, outcomeData.scaleGHGs, { skipHeader: false, origin: "A" + length });
      length = length + outcomeData.scaleGHGs.length + 2
    }
    if (outcomeData.sustainedGHGs && outcomeData.sustainedGHGs.length!=0){
      XLSX.utils.sheet_add_json(ws, [{title: 'Outcome of change / Sustained GHGs'}], { skipHeader: true, origin: "A" + length });
      length = length + 2
      XLSX.utils.sheet_add_json(ws, outcomeData.sustainedGHGs, { skipHeader: false, origin: "A" + length });
      length = length + outcomeData.scaleGHGs.length + 2
    }
    if (outcomeData.scaleSDs && outcomeData.scaleSDs.length!=0){
      XLSX.utils.sheet_add_json(ws, [{title: 'Outcome of change / Scale SDs'}], { skipHeader: true, origin: "A" + length });
      length = length + 2
      XLSX.utils.sheet_add_json(ws, outcomeData.scaleSDs, { skipHeader: false, origin: "A" + length });
      length = length + outcomeData.scaleSDs.length + 2
    }
    if (outcomeData.sustainedSDs && outcomeData.sustainedSDs.length!=0){
      XLSX.utils.sheet_add_json(ws, [{title: 'Outcome of change / Sustained SDs'}], { skipHeader: true, origin: "A" + length });
      length = length + 2
      XLSX.utils.sheet_add_json(ws, outcomeData.sustainedSDs, { skipHeader: false, origin: "A" + length });
      length = length + outcomeData.sustainedSDs.length + 2
    }

    XLSX.utils.sheet_add_json(ws, [{title: 'Transformational Change', value: this.score}], { skipHeader: true, origin: "A" + length });

    XLSX.utils.book_append_sheet(wb, ws, 'sheet1');

    XLSX.writeFile(wb, book_name + '.xlsx');
  }

  _mapProcessData(){ 
    let data = new ProcessData()
    if (this.processData?.technology && this.processData?.technology?.length !== 0){
      data.technology = this.processData.technology.map((ele: { characteristic: string; question: string; score: number; justification: string; }) => {
        let _data = new ProcessTableData()
        _data.Characteristic = ele.characteristic
        _data.Question = ele.question
        _data.Score = ele.score
        _data.Justification = ele.justification
        return _data
      })
    }

    if (this.processData.incentives && this.processData.incentives.length !== 0){
      data.incentives = this.processData.incentives.map((ele: { characteristic: string; question: string; score: number; justification: string; }) => {
        let _data = new ProcessTableData()
        _data.Characteristic = ele.characteristic
        _data.Question = ele.question
        _data.Score = ele.score
        _data.Justification = ele.justification
        return _data
      })
    }
    if (this.processData.norms && this.processData.norms.length !== 0){
      data.norms = this.processData.norms.map((ele: { characteristic: string; question: string; score: number; justification: string; }) => {
        let _data = new ProcessTableData()
        _data.Characteristic = ele.characteristic
        _data.Question = ele.question
        _data.Score = ele.score
        _data.Justification = ele.justification
        return _data
      })
    }

    return data
  }

  mapOutcomeData(){
    let data = new OutcomeData()
    if (this.outcomeData.scale_GHGs.length !== 0){
      data.scaleGHGs = this.outcomeData.scale_GHGs.map(ele => {
        let _data = new ScaleTableData()
        _data.Characteristic = ele.characteristic
        _data['Starting Situation'] = ele.starting_situation
        _data['Expected Impact'] = ele.expected_impacts
        let score = this.getOutcomeScores(ele.outcome_score,'scale_GHGs', ele.characteristic)
        _data.Score = score ? score.toString() : '-'
        _data.Justification = ele.justification
        return _data
      })
    }
    if (this.outcomeData.sustained_GHGs.length !== 0){
      data.sustainedGHGs = this.outcomeData.sustained_GHGs.map(ele => {
        let _data = new ScaleTableData()
        _data.Characteristic = this.changeOutcomeCharacteristicsName(ele.characteristic)
        _data['Starting Situation'] = ele.starting_situation
        _data['Expected Impact'] = ele.expected_impacts
        let score = this.getOutcomeScores(ele.outcome_score,'sustained_GHGs', ele.characteristic)
        _data.Score = score ? score.toString() : '-'
        _data.Justification = ele.justification
        return _data
      })
    }
    if (this.outcomeData.scale_SDs.length !== 0){
      data.scaleSDs = this.outcomeData.scale_SDs.map(ele => {
        let _data = new ScaleTableData()
        _data.SDG = this.getSDGName(ele.SDG)
        _data.Characteristic = ele.characteristic
        _data['Starting Situation'] = ele.starting_situation
        _data['Expected Impact'] = ele.expected_impacts
        let score = this.getOutcomeScores(ele.outcome_score,'scale_SDs', ele.characteristic)
        _data.Score = score ? score.toString() : '-'
        _data.Justification = ele.justification
        return _data
      })
    }
    if (this.outcomeData.sustained_SDs.length !== 0){
      data.sustainedSDs = this.outcomeData.sustained_SDs.map(ele => {
        let _data = new ScaleTableData()
        _data.SDG = this.getSDGName(ele.SDG)
        _data.Characteristic = this.changeOutcomeCharacteristicsName(ele.characteristic)
        _data['Starting Situation'] = ele.starting_situation
        _data['Expected Impact'] = ele.expected_impacts
        let score = this.getOutcomeScores(ele.outcome_score,'sustained_SDs', ele.characteristic)
        _data.Score = score ? score.toString() : '-'
        _data.Justification = ele.justification
        return _data
      })
    }
    return data
  }

  async toDownloadPdf(){
    this.isDownloading = true
    this.criterias.forEach((c: any) => {
      this.expandedRows[c] = true
    })

    await new Promise(r => setTimeout(r, 1000));

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
      pdf.save('download.pdf')
    })
    this.isDownloading = false
  }

  getSDGName(code: any) {
    if (code){
      let sdg = this.SDGs.find(o => o.code === code)
      return sdg !== undefined ? sdg.name : '-'
    } else {
      return '-'
    }
  }

  getOutcomeScores(code: any, category: string, characteristic: Characteristics) {
    if (code) {
      if (code === '-99') {
        return (this.scale_GHG_score_micro.find(o => o.code === code))?.name
      } else {
        if (category == 'scale_GHGs') {
          if (characteristic.code === 'MACRO_LEVEL') {
            return (this.scale_GHG_score_macro.find(o => o.code === code))?.value
          } else if (characteristic.code === 'MEDIUM_LEVEL') {
            return (this.scale_GHG_score_medium.find(o => o.code === code))?.value
          } else {
            return (this.scale_GHG_score_micro.find(o => o.code === code))?.value
          }
        }
        else if (category == 'sustained_GHGs') {
          return (this.sustained_GHG_score.find(o => o.code === code))?.value
        }
        else if (category == 'scale_SDs') {
          return (this.scale_SD_score.find(o => o.code === code))?.value
        }
        else if (category == 'sustained_SDs') {
          return (this.sustained_SD_score.find(o => o.code === code))?.value
        }
        else {
          return '-'
        }
      }
    } else {
      return '-'
    }
  }

  changeOutcomeCharacteristicsName(name: string) {
    if (name == 'Long term (>15 years)') {
      return 'International Level';
    } else if (name == 'Medium term (5-15 years)') {
      return 'National/Sector Level'
    } else if (name == 'Short term (<5 years)') {
      return 'Subnational/ subsectoral'
    } else if (name === 'Macro Level') {
      return 'International Level';
    } else if (name === 'Medium Level') {
      return 'National/Sector Level'
    } else if (name === 'Micro Level') {
      return 'Subnational/ subsectoral'
    } else {
      return name;
    }
  }

  getRelevance(relevance: number) {
    return this.relevances.find((o: any) => o.value === +relevance)?.name
  }


  confirm(){
    let body = new CreateReportDto()
    body.assessmentId = this.assessment.id;
    body.tool = this.masterDataService.getToolName('CARBON_MARKET')
    body.type = 'Result'
    body.climateAction = this.intervention
    body.reportName = this.reportName
    this.reportControllerServiceProxy.generateReport(body).subscribe(res => {
      if (res) {
       
        this.display = false;
        setTimeout(() => {
          window.open(this.SERVER_URL +'/report/downloadReport/inline/'+res.id, "_blank")
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Report generated successfully',
            closable: true,
          })
        },5000)
       
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

  async downloadFiles(documents: any[]) {
    await Promise.all(
      documents.map(async (doc) => {
        try {
          let response = await fetch(this.fileServerURL + '/' + doc);
          let blob = await response.blob();
          let link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.download = doc;
          link.style.display = 'none';

          document.body.appendChild(link);
          link.click();
  
          document.body.removeChild(link);
        } catch (error) {
        }
      })
    );
  }
}

export class ProcessData{
  technology: ProcessTableData[]
  incentives: ProcessTableData[]
  norms: ProcessTableData[]
}

export class ProcessTableData {
  Characteristic: string
  Question: string
  Score: number
  Justification: string
}
export class OutcomeData{
  scaleGHGs: any[]
  sustainedGHGs: any[]
  scaleSDs: any[]
  sustainedSDs: any[]
}

export class SustainedTableData{
  SDG: string
  Characteristic: string
  Question: string
  Score: string
  Justification: string
}

export class ScaleTableData{
  SDG: string
  Characteristic: string
  'Starting Situation': string
  'Expected Impact': string
  Score: string
  Justification: string
}

export class ColorMap {
  cell: string
  value: number
  color: string
}
