import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { GuidanceVideoComponent } from 'app/guidance-video/guidance-video.component';
import { MasterDataService } from 'app/shared/master-data.service';
import { environment } from 'environments/environment';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { Assessment, ClimateAction, CreateReportDto, MethodologyAssessmentControllerServiceProxy, ProjectControllerServiceProxy, ReportControllerServiceProxy } from 'shared/service-proxies/service-proxies';
import { openAuthenticatedReport } from 'app/shared/authenticated-download.util';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {

  searchBy: any = {
    climateAction: null,
    text: null,
  };

  climateActions: any[]
  display:boolean 
  allSelect: boolean
  reportName: string;
  assessmentTypes: any[]
 reportTypes=['Assessment reports','Portfolio reports']
 selectedReportTypes:string='';
 tools=['Investment','General','Carbon market']
 selectedTool:string='';
  selectedClimateAction: ClimateAction
  selectedAssessment: Assessment
  selectedAssessmentType: any
  assessments: Assessment[] = []
  pdfFiles: any;
  SERVER_URL = environment.baseUrlAPI;

  constructor(
    private projectControllerServiceProxy: ProjectControllerServiceProxy,
    private methodologyAssessmentControllerServiceProxy: MethodologyAssessmentControllerServiceProxy,
    private reportControllerServiceProxy: ReportControllerServiceProxy,
    private masterDataService: MasterDataService,
    private messageService: MessageService,
    protected dialogService: DialogService,
    private confirmationService: ConfirmationService,
    private http: HttpClient,
  ) { }

  async ngOnInit(): Promise<void> {
    this.assessmentTypes = this.masterDataService.assessment_type
    await this.loadClimateActions()
    this.filterReportData()
  }

  async loadClimateActions(){
    this.climateActions = await this.projectControllerServiceProxy.findAllPolicies().toPromise()
  }

  async loadAssessmnets(e: any) {
    this.assessments = await this.methodologyAssessmentControllerServiceProxy.getAssessmentByClimateAction(this.selectedClimateAction.id).toPromise()
  } 

  onCAChange(e: any){
    this.selectedTool='';
    this.searchBy.climateAction = e.value
    this.filterReportData()
  }

  onSelectType(e: any){
    this.selectedReportTypes=this.selectedReportTypes||''
   this.selectedTool='';
   this.searchBy.climateAction =''
   this.filterReportData();
  }

  watchVideo(){
    let ref = this.dialogService.open(GuidanceVideoComponent, {
      header: 'Guidance Video',
      width: '60%',
      contentStyle: {"overflow": "auto"},
      baseZIndex: 10000,
      data: {
        sourceName: 'Reports',
      },
    });

    ref.onClose.subscribe(() => {
      
    })
  }

  onSelectTool(e: any){
    this.filterReportData()
   }
  generate(){
    this.display = true;
  }

  onSearch(){
    this.filterReportData()
  }

  confirm(){
    let body = new CreateReportDto()
    body.assessmentId = this.selectedAssessment.id
    body.climateAction = this.selectedClimateAction
    body.reportName = this.reportName
    this.reportControllerServiceProxy.generateReport(body).subscribe(res => {
      if (res) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Report generated successfully',
          closable: true,
        })
        this.display = false
        this.filterReportData()
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

  filterReportData() {
    let climateAction = this.searchBy.climateAction ? this.searchBy.climateAction.policyName.toString() : "";
    let reportName = this.searchBy.text ? this.searchBy.text : "";
    let reportType = this.mapReportType(this.selectedReportTypes)

    this.reportControllerServiceProxy.getReportData(climateAction, reportName,reportType,this.mapReportTool(this.selectedTool)).subscribe(res => {
      this.pdfFiles = res;
    })


  }

  async view(report: { id: number }): Promise<void> {
    try {
      await openAuthenticatedReport(this.http, this.SERVER_URL, report.id);
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to open report',
        closable: true,
      });
    }
  }
  mapReportType(type: string ) : string {
    let returnType = ''

    if(type == 'Assessment reports'){
      returnType = 'Result'
    }
    else if(type == 'Portfolio reports'){
      returnType = 'Comparison'
    }
    else{
      returnType = ''
    }
    return returnType
  }

  mapReportTool(type: string ) : string {
    let returnType = ''

    if(type == 'Investment'){
      returnType = 'Investment tool'
    }
    else if(type == 'General'){
      returnType = 'General tool'
    }
    else if(type == 'Carbon market'){
      returnType = 'Carbon market tool'
    }
    else{
      returnType = ''
    }
    return returnType
  }

  deleteReport(report: any) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${report.reportName}"?`,
      header: 'Delete Confirmation',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      accept: () => {
        this.reportControllerServiceProxy.remove(report.id.toString()).subscribe(
          () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Report deleted successfully',
              closable: true,
            });
            this.filterReportData();
          },
          (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete report',
              closable: true,
            });
          }
        );
      }
    });
  }

}
