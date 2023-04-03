import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { LazyLoadEvent } from 'primeng/api';
import { Table } from 'primeng/table';
import { reduce } from 'rxjs/operators';
import { AssessmentControllerServiceProxy, ClimateAction, ParameterRequestControllerServiceProxy, ProjectControllerServiceProxy, ServiceProxy } from 'shared/service-proxies/service-proxies';
@Component({
  selector: 'app-managedatastatus',
  templateUrl: './managedatastatus.component.html',
  styleUrls: ['./managedatastatus.component.css']
})
export class ManagedatastatusComponent implements OnInit {

  projectApprovalStatusId: number = 1;
  // methodologies: Methodology[];
  searchText: string;
  countryId: any = 0;

  projects: ClimateAction[];

  loading: boolean;
  totalRecords: number = 0;
  rows: number = 10;
  last: number;
  event: any;

  searchBy: any = {
    text: null,
  };

  first = 0;
  sectorId: number = 1;


  constructor(private serviceProxy: ServiceProxy,
    // private assesmentProxy: AssessmentControllerServiceProxy,
    private assesmentProxy: AssessmentControllerServiceProxy,
    private parameterProxy: ParameterRequestControllerServiceProxy,
    private cdr: ChangeDetectorRef,
    private router: Router,
    // private assYearProxy: AssessmentYearControllerServiceProxy,
    private climateactionserviceproxy: ProjectControllerServiceProxy) { }
  ngAfterViewInit(): void {
    this.cdr.detectChanges();
    console.log("work");
  }
  @ViewChild("dt") table: Table;
  activeprojects: activeproject[] = [];
  activeprojectson: activeproject[] = [];
  activeprojectsload: activeproject[] = [];

  datarequests: datarequest[] = [];
  datarequests1: datarequest;
  asseYearId: any;
  alldatarequests: any;


  ngOnInit() {



    // this.serviceProxy
    //   .getManyBaseMethodologyControllerMethodology(
    //     undefined,
    //     undefined,
    //     undefined,
    //     undefined,
    //     ['version,ASC'],
    //     undefined,
    //     1000,
    //     0,
    //     0,
    //     0
    //   ).subscribe((res: any) => {
    //     this.methodologies = res.data;
    //     if (res.totalRecords !== null) {
    //       this.last = res.count;
    //     } else {
    //       this.last = 0;
    //     }
    //   })

  }





  onSearch() {
    let event: any = {};
    event.rows = this.rows;
    event.first = 0;

    this.loadgridData(event);
  }

  directToApprovePage(datarequests: any) {
    let assenmentYearId = datarequests.assenmentYearId
    this.router.navigate(['/app/app-approve-data'], {
      queryParams: { id: assenmentYearId },
    });
  }

  loadgridData(event: LazyLoadEvent) {


    this.loading = true;

    let filterText = this.searchBy.text ? this.searchBy.text : '';
    let projectStatusId = 0;

    let sectorId = this.sectorId;
    let statusId = 0;
    let mitigationActionTypeId = 0;

    this.projectApprovalStatusId = 5;
    this.countryId = 0;

    let assessmentStatusName = '';
    let Active = 4;
    let editedOn = 0;
    let pageNumber =
      event.first === 0 || event.first === undefined
        ? 1
        : (event.first / (event.rows === undefined ? 10 : event.rows)) + 1;
    this.rows = event.rows === undefined ? 10 : event.rows;

    console.log("pageNumber", pageNumber)
    console.log('this.rows', this.rows)
    console.log('totalRecords', this.totalRecords)
    this.assesmentProxy.assessmentYearForManageDataStatus(
      pageNumber,
      this.rows,
      filterText,
      projectStatusId,
      this.projectApprovalStatusId,
      0).subscribe(res => {
        console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaa", res)
        this.loading = false;
        this.totalRecords = res.meta.totalItems;
        this.datarequests = [];
        for (let assement of res.items) {
          let datarequests1: datarequest = {
            name: "",
            type: '',
            year: "",
            assenmentYearId: 0,
            totalreqCount: 0,
            pendingreqCount: 0,
            pendingdataentries: 0,
            recieved: 0,
            qaStatus: 0
          };
          datarequests1.name = assement.climateAction.policyName;
          datarequests1.year = assement.assessmentYear ? assement.year : "";
          datarequests1.type = assement.assessmentType;
          datarequests1.assenmentYearId = assement.id;
          // datarequests1.qaStatus = assement.qaStatus;


          this.parameterProxy
            .getDateRequestToManageDataStatus(assement.id, 1)
            .subscribe(re => {
              console.log("dr_dataRequestStatus", re)
              datarequests1.totalreqCount = re.length;

              for (let dr of re) {
                if (dr.dr_dataRequestStatus == -1 || dr.dr_dataRequestStatus == 1 || dr.dr_dataRequestStatus == 2) {
                  ++datarequests1.pendingreqCount;
                }
                if (dr.dr_dataRequestStatus == 3 || dr.dr_dataRequestStatus == -9 || dr.dr_dataRequestStatus == 4
                  || dr.dr_dataRequestStatus == 5 || dr.dr_dataRequestStatus == 6 || dr.dr_dataRequestStatus == -6 || dr.dr_dataRequestStatus == -8) {
                  ++datarequests1.pendingdataentries;
                }
                if (dr.dr_dataRequestStatus == 9 || dr.dr_dataRequestStatus == 8 || dr.dr_dataRequestStatus == 9 || dr.dr_dataRequestStatus == 11) {
                  ++datarequests1.recieved;
                }
              }
            })

          this.datarequests.push(datarequests1);
        }
      })


    //     datarequests1.name = assementYear.assesment.project.climateActionName;
    //     datarequests1.year = assementYear.assessmentYear ? assementYear.assessmentYear : "";
    //     datarequests1.type = assementYear.assesment.assessmentType;
    //     datarequests1.assenmentYearId = assementYear.id;
    //     datarequests1.qaStatus = assementYear.qaStatus;

    //     this.parameterProxy
    //       .getDateRequestToManageDataStatus(assementYear.assesment.id, assementYear.assessmentYear)
    //       .subscribe(res => {
    //         datarequests1.totalreqCount = res.length;

    //         console.log("dr_dataRequestStatus", res)

    //         for (let dr of res) {

    //           if (dr.dr_dataRequestStatus == -1 || dr.dr_dataRequestStatus == 1 || dr.dr_dataRequestStatus == 2) {
    //             ++datarequests1.pendingreqCount;
    //           }

    //           if (dr.dr_dataRequestStatus == 3 || dr.dr_dataRequestStatus == -9 || dr.dr_dataRequestStatus == 4
    //             || dr.dr_dataRequestStatus == 5 || dr.dr_dataRequestStatus == 6 || dr.dr_dataRequestStatus == -6 || dr.dr_dataRequestStatus == -8) {
    //             ++datarequests1.pendingdataentries;
    //           }

    //           if (dr.dr_dataRequestStatus == 9 || dr.dr_dataRequestStatus == 8 || dr.dr_dataRequestStatus == 9 || dr.dr_dataRequestStatus == 11) {
    //             ++datarequests1.recieved;
    //           }
    //         }
    //       })
    //     this.datarequests.push(datarequests1);
    //   }
    // })
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

  // isLastPage(): boolean {
  //   return this.methodologies
  //     ? this.first === this.methodologies.length - this.rows
  //     : true;
  // }

  // isFirstPage(): boolean {
  //   return this.methodologies ? this.first === 0 : true;
  // }

  status() { }

}

export interface activeproject {
  name: string,
  ertarget: number,
  targetyear: string,
  erarchievment: number,
  archivmentyear: string
};

export interface datarequest {
  name: string,
  type: string,
  year: string,
  assenmentYearId: number,
  totalreqCount: number,
  pendingreqCount: number,
  pendingdataentries: number,
  recieved: number,
  qaStatus: number
};