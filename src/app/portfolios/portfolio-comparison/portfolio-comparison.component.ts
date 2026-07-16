import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MasterDataService } from 'app/shared/master-data.service';
import { MessageService } from 'primeng/api';
import { CreateComparisonReportDto, PortfolioControllerServiceProxy, ReportControllerServiceProxy } from 'shared/service-proxies/service-proxies';
import { ColorMap } from 'app/Tool/carbon-market/cm-result/cm-result.component';


import * as XLSX from 'xlsx-js-style';
import { environment } from 'environments/environment';
import * as moment from 'moment';
import { openAuthenticatedReport } from 'app/shared/authenticated-download.util';
@Component({
  selector: 'app-portfolio-comparison',
  templateUrl: './portfolio-comparison.component.html',
  styleUrls: ['./portfolio-comparison.component.css']
})
export class PortfolioComparisonComponent implements OnInit {
  activeIndexMain: number;
  display: boolean;
  onMainTabChange($event: any) {
    throw new Error('Method not implemented.');
  }
  portfolioId: number;
  assessmentList: any[];
  portfolio: any;
  card: any = [];
  noOfAssessments: any;
  process_data: any;
  outcome_data: any;
  aggregation_data: any;
  alignment_data: any;
  isLoaded: boolean = false;
  hasCMToolAssessments: boolean = false
  isDownloading: boolean;
  reportName: string;
  SERVER_URL = environment.baseUrlAPI;
  constructor(
    private route: ActivatedRoute,
    private portfolioServiceProxy: PortfolioControllerServiceProxy,
    private reportControllerServiceProxy: ReportControllerServiceProxy,
    private masterDataService: MasterDataService,
    private messageService: MessageService,
    private http: HttpClient,
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(async (params: { [x: string]: number; }) => {
      this.portfolioId = params['id'];
      await this.getAssessmentsByPortfolio()
      await this.getPortfolioData()
      await this.getDummyData()
      this.hasCMTool()
      this.isLoaded = true
    });
  }

  async getAssessmentsByPortfolio() {
    this.assessmentList = await this.portfolioServiceProxy.assessmentsByPortfolioId(this.portfolioId).toPromise()
  }

  async getPortfolioData() {
    this.portfolio = (await this.portfolioServiceProxy.getPortfolioById(this.portfolioId).toPromise())[0]
    this.noOfAssessments = (await this.portfolioServiceProxy.assessmentsDataByAssessmentId(this.portfolioId).toPromise()).length
    let date = moment(this.portfolio.date).format('DD/MM/YYYY')

    this.card.push(
      ...[
        { title: 'Portfolio ID', data: this.portfolio.portfolioId },
        { title: 'Name of the portfolio', data: this.portfolio.portfolioName },
        { title: 'Description', data: this.portfolio.description },
        { title: 'Date', data: date },
        { title: 'Is this assessment an update of a previous assessment?', data: this.portfolio.IsPreviousAssessment },
        { title: 'Link to previous assessment', data: this.portfolio.link },
        { title: 'Objective(s) of the assessment', data: this.portfolio.objectives },
        { title: 'Intended audience(s) of the assessment', data: this.portfolio.audience },
        { title: 'Number of assessments', data: await this.assessmentList.length },
      ])
  }

  hasCMTool() {
    if (this.assessmentList.find(o => o.assessment.tool === 'CARBON_MARKET')) this.hasCMToolAssessments = true
    else this.hasCMToolAssessments = false
  }

  async getDummyData() {
    let interventions = await this.portfolioServiceProxy.getPortfolioComparisonData(this.portfolioId).toPromise();
   

    this.process_data = interventions.process_data
    this.outcome_data = interventions.outcome_data
    this.alignment_data = interventions.alignment_data

    this.aggregation_data = {
      col_set_1: [
        { label: 'Intervention information', colspan: 4 },
        { label: '', colspan: 1 }
      ],
      col_set_2: [
        { label: 'ID', code: 'id' },
        { label: 'Intervention name', code: 'name' },
        { label: 'Tool applied', code: 'tool' },
        { label: 'Status', code: 'status' },
        { label: 'Expected average GHG reductions or removals (mitigation outcomes) (tCO₂e/year)', code: 'mitigation' },
      ],
      interventions: interventions.aggregation_data.interventions,
      total: interventions.aggregation_data.total
    }
  }
  
  genarateExcel() {
    this.isDownloading = true

    setTimeout(() => {
      let tabledetail = document.getElementById('one');
      let tableComparison = document.getElementById('two');
      let workSheettabledetai = XLSX.utils.table_to_sheet(tabledetail, {});
      let workSheettableComparison = XLSX.utils.table_to_sheet(tableComparison, {});

      let workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, workSheettabledetai, 'Details');
      XLSX.utils.book_append_sheet(workbook, workSheettableComparison, 'Comparison');

      let length = (XLSX.utils.sheet_to_json(workSheettableComparison, { raw: false, header: 1 })).length
      let alignment_position = length - this.alignment_data.interventions.length + 1
      let col_count = this.alignment_data.col_set_1.length - 2;
      let cols = this.getNextLetters('E', col_count);
      let row_count = this.alignment_data.interventions.length;
      let rows = [];
      for (let i = 0; i < row_count; i++) {
        const nextInteger = alignment_position + i;
        rows.push(nextInteger);
      }
      let colorMap = this.createColorMap(cols, rows)
      for (const itm of colorMap) {
        if (workSheettableComparison[itm.cell]) {
          workSheettableComparison[itm.cell].s = {
            fill: { fgColor: { rgb: itm.color } },
            font: { color: { rgb: itm.color } }
          };
        }
      }
      XLSX.writeFile(workbook, "Report.xlsx", { cellStyles: true });
    }, 1000);
  }
  confirm() {
    
    let body = new CreateComparisonReportDto();
    body.portfolioId = this.portfolioId;
    body.tool = "";
    body.type = 'Comparison';
    body.reportName = this.reportName;
    body.reportTitle = this.portfolio.portfolioName;
    this.reportControllerServiceProxy.generateComparisonReport(body).subscribe(res => {
   
      if (res) {
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
      this.display = false
    }, error => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to generate report',
        closable: true,
      })
    })
  }

  createColorMap(_cols: any, _rows: any) {
    let colorMap = [];
    let cols = _cols;
    let rows = _rows;

    for (let [index, col] of this.alignment_data.col_set_2.entries()) {
      for (let [idx, intervention] of this.alignment_data.interventions.entries()) {
        if (intervention[col.code]?.name) {
          let obj = new ColorMap();
          obj.cell = cols[index - 4] + rows[idx];
          obj.color = this.getBackgroundColor(+intervention[col.code].value).replace('#', '');
          colorMap.push(obj);
        }
      }
    }
    return colorMap;
  }


  getNextLetters(letter: string, num: number) {
    if (typeof letter !== 'string' || letter.length !== 1 || !/^[A-Za-z]$/.test(letter)) {
      return 'Invalid input';
    }

    const startCharCode = letter.toUpperCase().charCodeAt(0); 
    const nextLetters = [letter.toUpperCase()];

    for (let i = 1; i <= num; i++) {
      const nextCharCode = startCharCode + i;
      const nextLetter = String.fromCharCode(nextCharCode);
      nextLetters.push(nextLetter);
    }
    return nextLetters.join("");
  }

  getBackgroundColor(value: any): string {
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
  generate(){
    this.display = true;
  }

}
