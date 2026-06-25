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
import { scoresMatchMatrixCell } from 'app/shared/score-rounding.util';
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
  adaptation_scale_score: ScoreDto[]
  adaptation_sustained_score: ScoreDto[]
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
      this.adaptation_scale_score = this.masterDataService.adaptation_scale_score;
      this.adaptation_sustained_score = this.masterDataService.adaptation_sustained_score;
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
    const processScore = this.score?.process_score;
    const outcomeScore = this.score?.outcome_score?.outcome_score;
    if (
      processScore != null &&
      outcomeScore != null &&
      scoresMatchMatrixCell(processScore, outcomeScore, y, x)
    ) {
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
    const book_name = 'Results - ' + this.intervention.policyName;
    const workbook = XLSX.utils.book_new();
    const infoWs: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.card, {
      skipHeader: true,
    });
    XLSX.utils.book_append_sheet(workbook, infoWs, 'Assessment Info');
    XLSX.utils.book_append_sheet(
      workbook,
      this.buildAssessmentResultsSheet(),
      'Assessment Results',
    );

    const colorMap = this.createColorMap();
    const heatmapEl = document.getElementById('heatmap');
    if (heatmapEl) {
      const heatmap = XLSX.utils.table_to_sheet(heatmapEl, {});
      for (const itm of colorMap) {
        if (heatmap[itm.cell]) {
          heatmap[itm.cell].s = {
            fill: { fgColor: { rgb: itm.color } },
            font: { color: { rgb: itm.color } },
          };
        }
      }
      XLSX.utils.book_append_sheet(workbook, heatmap, 'Score map');
    }

    XLSX.writeFile(workbook, book_name + '.xlsx', { cellStyles: true });
  }

  private buildAssessmentResultsSheet(): XLSX.WorkSheet {
    let length = 0;
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet([], {
      skipHeader: true,
    });

    length = length + this.card.length + 2;

    this.sections.forEach((section) => {
      XLSX.utils.sheet_add_json(ws, [{ section: section }], {
        skipHeader: true,
        origin: 'A' + length,
      });
      length = length + 2;
      XLSX.utils.sheet_add_json(ws, this.results[section], {
        skipHeader: false,
        origin: 'A' + length,
      });
      length = length + this.results[section].length + 2;
    });

    XLSX.utils.sheet_add_json(
      ws,
      [{ title: 'Transformational change criteria' }],
      { skipHeader: true, origin: 'A' + length },
    );
    length = length + 2;

    const outcomeData = this.mapOutcomeData();
    length = this.appendOutcomeSection(
      ws,
      length,
      'Outcome of change / Scale GHGs',
      outcomeData.scaleGHGs,
    );
    length = this.appendOutcomeSection(
      ws,
      length,
      'Outcome of change / Sustained GHGs',
      outcomeData.sustainedGHGs,
    );
    length = this.appendOutcomeSection(
      ws,
      length,
      'Outcome of change / Scale SDs',
      outcomeData.scaleSDs,
    );
    length = this.appendOutcomeSection(
      ws,
      length,
      'Outcome of change / Sustained SDs',
      outcomeData.sustainedSDs,
    );
    length = this.appendOutcomeSection(
      ws,
      length,
      'Outcome of change / Scale Adaptation',
      outcomeData.scaleAdaptation,
    );
    length = this.appendOutcomeSection(
      ws,
      length,
      'Outcome of change / Sustained Adaptation',
      outcomeData.sustainedAdaptation,
    );

    XLSX.utils.sheet_add_json(
      ws,
      [{ title: 'Aggregate outcome categories assessment' }],
      { skipHeader: true, origin: 'A' + length },
    );
    length = length + 2;
    XLSX.utils.sheet_add_json(ws, this.buildOutcomeSummaryRows(), {
      skipHeader: false,
      origin: 'A' + length,
    });
    length = length + this.buildOutcomeSummaryRows().length + 2;

    XLSX.utils.sheet_add_json(
      ws,
      [
        {
          title: 'Transformational Change',
          process_score: this.score.process_score,
          outcome_score: this.score.outcome_score?.outcome_score,
        },
      ],
      { skipHeader: true, origin: 'A' + length },
    );

    return ws;
  }

  private appendOutcomeSection(
    ws: XLSX.WorkSheet,
    length: number,
    title: string,
    rows: Record<string, string>[] | undefined,
  ): number {
    if (!rows?.length) {
      return length;
    }
    XLSX.utils.sheet_add_json(ws, [{ title }], {
      skipHeader: true,
      origin: 'A' + length,
    });
    length = length + 2;
    XLSX.utils.sheet_add_json(ws, rows, {
      skipHeader: false,
      origin: 'A' + length,
    });
    return length + rows.length + 2;
  }

  private buildOutcomeSummaryRows(): { Category: string; 'Aggregated score': string }[] {
    const outcome = this.score.outcome_score;
    return [
      {
        Category: 'Scale of outcome - GHGs',
        'Aggregated score': this.formatAggregateScore(outcome?.scale_ghg_score),
      },
      {
        Category: 'Scale of outcome - Sustainable development',
        'Aggregated score': this.formatAggregateScore(outcome?.scale_sdg_score),
      },
      {
        Category: 'Scale of outcome - Adaptation co-benefits',
        'Aggregated score': this.formatAggregateScore(
          outcome?.scale_adaptation_score,
        ),
      },
      {
        Category: 'Outcome sustained over time - GHGs',
        'Aggregated score': this.formatAggregateScore(
          outcome?.sustained_ghg_score,
        ),
      },
      {
        Category: 'Outcome sustained over time - Sustainable development',
        'Aggregated score': this.formatAggregateScore(
          outcome?.sustained_sdg_score,
        ),
      },
      {
        Category: 'Outcome sustained over time - Adaptation co-benefits',
        'Aggregated score': this.formatAggregateScore(
          outcome?.sustained_adaptation_score,
        ),
      },
      {
        Category: 'Sustainable development (combined scale & sustained)',
        'Aggregated score': this.formatAggregateScore(outcome?.sdg_score),
      },
      {
        Category: 'Outcomes score',
        'Aggregated score': this.formatAggregateScore(outcome?.outcome_score),
      },
    ];
  }

  private formatAggregateScore(score: number | null | undefined): string {
    if (score === null || score === undefined) {
      return 'N/A';
    }
    return score.toString();
  }

  private formatScoreForExport(
    score: number | string | null | undefined,
  ): string {
    if (score === null || score === undefined || score === '') {
      return '-';
    }
    return score.toString();
  }

  mapOutcomeData(){
    let data = new OutcomeData()
    if (this.outcomeData.scale_GHGs.length !== 0){
      data.scaleGHGs = this.outcomeData.scale_GHGs.map(ele => {
        let _data = new ScaleTableData()
        _data.Characteristic = this.changeOutcomeCharacteristicsName(ele.characteristic)
        _data['Starting Situation'] = ele.starting_situation
        _data['Expected Impact'] = ele.expected_impact ?? ele.expected_impacts
        const score = this.getOutcomeScores(ele.outcome_score,'scale_GHGs', ele.characteristic)
        _data.Score = this.formatScoreForExport(score)
        _data.Justification = ele.justification
        return _data
      })
    }
    if (this.outcomeData.sustained_GHGs.length !== 0){
      data.sustainedGHGs = this.outcomeData.sustained_GHGs.map(ele => {
        let _data = new ScaleTableData()
        _data.Characteristic = this.changeOutcomeCharacteristicsName(ele.characteristic)
        _data['Starting Situation'] = ele.starting_situation
        _data['Expected Impact'] = ele.expected_impact ?? ele.expected_impacts
        const score = this.getOutcomeScores(ele.outcome_score,'sustained_GHGs', ele.characteristic)
        _data.Score = this.formatScoreForExport(score)
        _data.Justification = ele.justification
        return _data
      })
    }
    if (this.outcomeData.scale_SDs.length !== 0){
      data.scaleSDs = this.outcomeData.scale_SDs.map(ele => {
        let _data = new ScaleTableData()
        _data.SDG = ele.SDG ?? this.getSDGName(ele.SDG)
        _data.Characteristic = this.changeOutcomeCharacteristicsName(ele.characteristic)
        _data['Starting Situation'] = ele.starting_situation
        _data['Expected Impact'] = ele.expected_impact ?? ele.expected_impacts
        const score = this.getOutcomeScores(ele.outcome_score,'scale_SDs', ele.characteristic)
        _data.Score = this.formatScoreForExport(score)
        _data.Justification = ele.justification
        return _data
      })
    }
    if (this.outcomeData.sustained_SDs.length !== 0){
      data.sustainedSDs = this.outcomeData.sustained_SDs.map(ele => {
        let _data = new ScaleTableData()
        _data.SDG = ele.SDG ?? this.getSDGName(ele.SDG)
        _data.Characteristic = this.changeOutcomeCharacteristicsName(ele.characteristic)
        _data['Starting Situation'] = ele.starting_situation
        _data['Expected Impact'] = ele.expected_impact ?? ele.expected_impacts
        const score = this.getOutcomeScores(ele.outcome_score,'sustained_SDs', ele.characteristic)
        _data.Score = this.formatScoreForExport(score)
        _data.Justification = ele.justification
        return _data
      })
    }
    if (this.outcomeData.scale_adaptation.length !== 0){
      data.scaleAdaptation = this.outcomeData.scale_adaptation.map(ele => {
        let _data = new ScaleTableData()
        _data.Characteristic = this.changeOutcomeCharacteristicsName(ele.characteristic)
        _data['Starting Situation'] = ele.starting_situation
        _data['Expected Impact'] = ele.expected_impact ?? ele.expected_impacts
        _data['Adaptation co-benefit'] = ele.adaptation
        const score = this.getOutcomeScores(ele.outcome_score,'scale_adaptation', ele.characteristic)
        _data.Score = this.formatScoreForExport(score)
        _data.Justification = ele.justification
        return _data
      })
    }
    if (this.outcomeData.sustained_adaptation.length !== 0){
      data.sustainedAdaptation = this.outcomeData.sustained_adaptation.map(ele => {
        let _data = new ScaleTableData()
        _data.Characteristic = this.changeOutcomeCharacteristicsName(ele.characteristic)
        _data['Starting Situation'] = ele.starting_situation
        _data['Expected Impact'] = ele.expected_impact ?? ele.expected_impacts
        const score = this.getOutcomeScores(ele.outcome_score,'sustained_adaptation', ele.characteristic)
        _data.Score = this.formatScoreForExport(score)
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
    if (code === null || code === undefined || code === '') {
      return '-';
    }

    const codeStr = String(code);
    if (codeStr === '-99') {
      return 'Outside assessment boundaries';
    }

    const findScoreValue = (scores: ScoreDto[]) =>
      scores.find((o) => o.code === codeStr)?.value;

    const findScoreName = (scores: ScoreDto[]) =>
      scores.find((o) => o.code === codeStr)?.name;

    switch (category) {
      case 'scale_GHGs':
        if (characteristic?.code === 'MACRO_LEVEL') {
          return findScoreValue(this.scale_GHG_score_macro);
        }
        if (characteristic?.code === 'MEDIUM_LEVEL') {
          return findScoreValue(this.scale_GHG_score_medium);
        }
        return findScoreValue(this.scale_GHG_score_micro);
      case 'sustained_GHGs':
        return findScoreValue(this.sustained_GHG_score);
      case 'scale_SDs':
        return findScoreValue(this.scale_SD_score);
      case 'sustained_SDs':
        return findScoreValue(this.sustained_SD_score);
      case 'scale_adaptation':
        return findScoreValue(this.adaptation_scale_score);
      case 'sustained_adaptation':
        return findScoreValue(this.adaptation_sustained_score);
      default:
        return findScoreName(this.scale_GHG_score_micro) ?? '-';
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

export class OutcomeData{
  scaleGHGs: any[]
  sustainedGHGs: any[]
  scaleSDs: any[]
  sustainedSDs: any[]
  scaleAdaptation: any[]
  sustainedAdaptation: any[]
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
  'Adaptation co-benefit': string
  Score: string
  Justification: string
}

export class ColorMap {
  cell: string
  value: number
  color: string
}
