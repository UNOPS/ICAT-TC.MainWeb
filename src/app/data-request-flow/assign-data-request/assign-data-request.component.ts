import {
  Notification,
  ParameterHistoryControllerServiceProxy,
  UpdateDeadlineDto,
  User,
} from './../../../shared/service-proxies/service-proxies';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { LazyLoadEvent, MessageService } from 'primeng/api';
import decode from 'jwt-decode';
import {
  ParameterRequestControllerServiceProxy,
  ClimateAction as Project,
  ProjectControllerServiceProxy,
  ServiceProxy,
  UsersControllerServiceProxy,
} from 'shared/service-proxies/service-proxies';
import { Tool } from '../enum/tool.enum';
import { DataRequestPathService } from 'app/shared/data-request-path.service';
import { MasterDataService } from 'app/shared/master-data.service';

@Component({
  selector: 'app-assign-data-request',
  templateUrl: './assign-data-request.component.html',
  styleUrls: ['./assign-data-request.component.css'],
})
export class AssignDataRequestComponent implements OnInit, AfterViewInit {
  userList: User[];


  climateactions: Project[];
  assignCAArray: any[] = [];



  selectedAssignDataRequest: Project[];
  selectedParameters: any[];
  selectedUser: any;
  climateaction: Project = new Project();
  assignDataRequestList: any[];
  selectedDeadline: Date;
  minDate: Date;
  confirm1: boolean = false;
  userName: string;

  searchText: string;

  loading: boolean;
  totalRecords: number = 0;
  rows: number = 10;
  last: number;
  event: any;
  currantUser:any;

  searchBy: any = {
    text: null,
    climateAction: null,
  };

  first = 0;
  paraId: number;
  requestHistoryList: any[] = [];
  displayHistory: boolean = false;
  climateActionListFromBackend: any[] = [];
  userCountryId: number = 0;
  userSectorId: number = 0;
  climateactionsList: any[] = [];


  activeIndexMain =0;
  tabIndex =0;
  tool:any='';
  category: string | undefined;
  sdg: string | undefined;
  indicator: string | undefined;
  startingSituation: string | undefined;
  expectedImpact: string | undefined;
  justification: string | undefined;
  constructor(
    private router: Router,
    private serviceProxy: ServiceProxy,
    private cdr: ChangeDetectorRef,
    private parameterProxy: ParameterRequestControllerServiceProxy,
    private usersControllerServiceProxy: UsersControllerServiceProxy,
    private messageService: MessageService,
    private prHistoryProxy: ParameterHistoryControllerServiceProxy,
    private climateProxy: ProjectControllerServiceProxy,
    public dataRequestPathService: DataRequestPathService,
    public masterDataService: MasterDataService

  ) { }
  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

  async ngOnInit(): Promise<void> {
    this.tool=Tool.CM_tool;
    const token = localStorage.getItem('ACCESS_TOKEN')!;
    const tokenPayload = decode<any>(token);
    this.userName =tokenPayload.username;
    this.userCountryId = tokenPayload.countryId;
    this.userSectorId = tokenPayload.sectorId;

    this.climateActionListFromBackend = await this.parameterProxy.getClimateActionByDataRequestStatus().toPromise();
    this.currantUser=this.usersControllerServiceProxy.findUserByEmail(this.userName).toPromise();

    let filter2: string[] = new Array();

    filter2.push('projectApprovalStatus.id||$eq||' + 5);
    this.getdata();


    this.usersControllerServiceProxy
      .usersByInstitution(1, 1000, '', 9, this.userName)
      .subscribe((res: any) => {
        this.userList = res.items;
      });
  }
  getdata(){
    this.parameterProxy
    .getAssignDateRequest(
      0,
      0,
      '',
      0,
      this.userName,
      this.tool,
      "1234"
    )
    .subscribe((res) => {
      for (let a of res.items) {
        if(this.tool==Tool.CM_tool){
          if (a?.cmAssessmentAnswer?.assessment_question?.assessment?.climateAction !== null) {
            if (
              !this.assignCAArray.includes(
                a.cmAssessmentAnswer.assessment_question.assessment.climateAction.policyName
              )
              
            ) {

              this.assignCAArray.push(
                a.cmAssessmentAnswer.assessment_question.assessment.climateAction.policyName
              );
              this.climateactionsList.push(
                a.cmAssessmentAnswer.assessment_question.assessment.climateAction                
              );
             
            }
          }

        }
        



      }

    });

  }
  onCAChange(event: any) {    
    this.onSearch();
  }

  onAssignClick() {
    if (this.selectedParameters.length > 0) {
      this.confirm1 = true;

    }
  }

  onSearchClick(event: any) {
    this.onSearch();
  }

  onSearch() {
    let event: any = {};
    event.rows = this.rows;
    event.first = 0;

    this.loadgridData(event);
  }


  loadgridData = (event: LazyLoadEvent) => {
    
    this.loading = true;
    this.totalRecords = 0;

    let climateActionId = this.searchBy.climateAction
      ? this.searchBy.climateAction.id
      : 0;

    let filtertext = this.searchBy.text ? this.searchBy.text : '';

    let pageNumber =
      event.first === 0 || event.first === undefined
        ? 1
        : event.first / (event.rows === undefined ? 1 : event.rows) + 1;
    this.rows = event.rows === undefined ? 10 : event.rows;
    setTimeout(() => {
      this.parameterProxy
        .getAssignDateRequest(
          pageNumber,
          this.rows,
          filtertext,
          climateActionId,
          this.userName,
          this.tool,
          "1234"
        )
        .subscribe((res) => {
          if (res) {
            this.assignDataRequestList = res.items;
            this.totalRecords = res.meta.totalItems;
            this.assignCAArray.length=0;
            this.climateactionsList.length=0;
            for (let a of res.items) {
              if(this.tool==Tool.CM_tool){
               
                if (a?.cmAssessmentAnswer?.assessment_question?.assessment?.climateAction !== null) {
                  if (
                    !this.assignCAArray.includes(
                      a.cmAssessmentAnswer.assessment_question.assessment.climateAction.policyName
                    )
                    
                  ) {
      
                    this.assignCAArray.push(
                      a.cmAssessmentAnswer.assessment_question.assessment.climateAction.policyName
                    );
                    this.climateactionsList.push(
                      a.cmAssessmentAnswer.assessment_question.assessment.climateAction                      
                    );
                   
                  }
                }
      
              }
              else if(this.tool==Tool.Investor_tool||Tool.Portfolio_tool){
                
                if (a?.investmentParameter?.assessment?.climateAction?.policyName !== null) {
                  if (
                    !this.assignCAArray.includes(
                      a.investmentParameter.assessment.climateAction.policyName
                    )
                    
                  ) {      
                    this.assignCAArray.push(
                      a.investmentParameter.assessment.climateAction.policyName
                    );
                    this.climateactionsList.push(
                      a.investmentParameter.assessment.climateAction                      
                    );
                   
                  }
                }
      
              }
              
      
      
      
            }
          }
          this.loading = false;
        });
    }, 1);
  };

  addproject() {
    this.router.navigate(['/propose-project']);
  }

  detail() {
    this.router.navigate(['/project-information']);
  }

  next() {
    this.first = this.first + this.rows;
  }

  prev() {
    this.first = this.first - this.rows;
  }

  reset() {
    this.first = 0;
  }


  getInfo(obj: any) {
    if (this.tool == Tool.CM_tool) {
      let res = this.dataRequestPathService.getInfo(obj, this.tool)
      this.paraId = res?.paraId;
      this.category = res?.category
      this.sdg = res.sdg
      this.indicator = res.indicator
      this.startingSituation = res.startingSituation
      this.expectedImpact = res.expectedImpact
      this.justification = res.justification
    }
    else if (this.tool == Tool.Investor_tool || Tool.Portfolio_tool) {
      let res = this.dataRequestPathService.getInfo(obj, this.tool)
      this.paraId = res.paraId
    }
    this.prHistoryProxy
      .getHistroyByid(this.paraId)
      .subscribe((res) => {

        this.requestHistoryList = res;
      });

    this.displayHistory = true;
  }

  isLastPage(): boolean {
    return this.climateactions
      ? this.first === this.climateactions.length - this.rows
      : true;
  }

  isFirstPage(): boolean {
    return this.climateactions ? this.first === 0 : true;
  }

  search() {
    let a: any = {};
    a.rows = this.rows;
    a.first = 0;
  }

  removeFromString(arr: string[], str: string) {
    let escapedArr = arr.map((v) => escape(v));
    let regex = new RegExp(
      '(?:^|\\s)' + escapedArr.join('|') + '(?!\\S)',
      'gi'
    );
    return str.replace(regex, '');
  }
  onClickSave(status: number) {
    let notification =new Notification();
    notification.fromUser= this.currantUser;
    
    let userId: number = this.selectedUser ? this.selectedUser.id : 0;
    let idList = new Array<number>();
    if (userId > 0 && this.selectedParameters.length > 0) {
      for (let index = 0; index < this.selectedParameters.length; index++) {
        const element = this.selectedParameters[index];
        idList.push(element.id);
      }

      let inputParameters = new UpdateDeadlineDto();
      inputParameters.ids = idList;
      inputParameters.userId = userId;
      inputParameters.status = status;
      inputParameters.deadline = moment(this.selectedDeadline);
      this.parameterProxy.updateDeadlineDataEntry(inputParameters).subscribe(
        (res) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: status == 3 ? 'A Data Entry Operator is saved successfully' : 'A Data Entry Operator is assigned successfully',
          });
          this.selectedParameters = [];
          this.onSearch();
          this.confirm1 = false;

        },
        (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error.',
            detail: 'Internal server error, please try again.',
          });
        }
      );
    }
  }

  onMainTabChange(event:any){
    this.tabIndex= this.activeIndexMain;
    
    let event2 :LazyLoadEvent ={rows: 10, first: 0}
    if (this.activeIndexMain==0){
     this.tool=Tool.CM_tool
     this.loadgridData(event);
    }
    else if (this.activeIndexMain==1){
      this.tool=Tool.Investor_tool
      this.loadgridData(event);
    }
    else if (this.activeIndexMain==2){
      this.tool=Tool.Portfolio_tool;
      this.loadgridData(event);
      
    }
  }
}
