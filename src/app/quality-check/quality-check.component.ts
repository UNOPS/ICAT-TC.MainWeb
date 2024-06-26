import { Component, OnInit } from '@angular/core';
import { QuAlityCheckStatus } from 'app/Model/QuAlityCheckStatus.enum';
import { LazyLoadEvent } from 'primeng/api';
import { Router } from '@angular/router';
import decode from 'jwt-decode';

import {
  Assessment,
  QualityCheckControllerServiceProxy,
  ServiceProxy,
} from 'shared/service-proxies/service-proxies';

@Component({
  selector: 'app-quality-check',
  templateUrl: './quality-check.component.html',
  styleUrls: ['./quality-check.component.css'],
})
export class QualityCheckComponent implements OnInit {
  QuAlityCheckStatusEnum = QuAlityCheckStatus;
  qualityCheckStatus: string[] = [
    QuAlityCheckStatus[QuAlityCheckStatus.Pending],
    QuAlityCheckStatus[QuAlityCheckStatus.InProgress],
    QuAlityCheckStatus[QuAlityCheckStatus.Fail],
    QuAlityCheckStatus[QuAlityCheckStatus.Pass],
  ];
  searchBy: any = {
    status: null,
    text: null,
    ndc: null,
    subNdc: null,
  };
  parameteters: Assessment[] = [];
  climateAction: any[] = [];
  loading: boolean;
  totalRecords: number = 0;
  itemsPerPage: number = 0
  isActive: boolean = false;
  rows: number = 10;
  last: number;
  event: any;
  userCountryId: any;
  userSectorId: any;
  usrRole: any;
  qcDisable: boolean = false;
  constructor(
    private serviceProxy: ServiceProxy,
    private qaServiceProxy: QualityCheckControllerServiceProxy,
    private router: Router
  ) { }

  async ngOnInit(): Promise<void> {

    const token = localStorage.getItem('ACCESS_TOKEN')!;
    const tokenPayload = decode<any>(token);
    this.userCountryId = tokenPayload.countryId;
    this.userSectorId = tokenPayload.sectorId;
    this.usrRole = tokenPayload.role.code;


    if (this.usrRole == "QC Team" || this.usrRole == "MRV Admin") {
      this.qcDisable = true;
    }
    else {
      this.qcDisable = false;
    }




    let filtertext = this.searchBy.text ? this.searchBy.text : '';

    await this.qaServiceProxy.getQCParameters(
      1,
      10000,
      0,
      filtertext,
      '',
    )
      .subscribe((a) => {
        a.items.forEach((b: any) => {
          if (!this.climateAction.includes(b.climateAction.policyName)) {            
            this.climateAction.push(b.climateAction.policyName);
          }

        })
      });

    this.onSearch();
  }

  onStatusChange($event: any) {
    this.onSearch();
  }

  onNDChange($event: any) { }

  onSubNdCChange($event: any) { }

  onSearch() {
    let event: any = {};
    event.rows = this.rows;
    event.first = 0;

    this.loadgridData(event);
  }

  loadgridData = (event: LazyLoadEvent) => {
    this.loading = true;
    this.totalRecords = 0;

    let statusId = this.searchBy.status
      ? Number(QuAlityCheckStatus[this.searchBy.status])
      : 0;
    let filtertext = this.searchBy.text ? this.searchBy.text : '';
    let ndcId = this.searchBy.ndc ? this.searchBy.ndc.id : 0;
    let subNDC = this.searchBy.subNdc ? this.searchBy.subNdc.id : 0;
    let ctAction = this.searchBy.climateaction
      ? this.searchBy.climateaction
      : '';
    let pageNumber =
      event.first === 0 || event.first === undefined
        ? 1
        : event.first / (event.rows === undefined ? 1 : event.rows) + 1;
    this.rows = event.rows === undefined ? 10 : event.rows;
    let Active = 0;
    setTimeout(() => {
      this.qaServiceProxy
        .getQCParameters(
          pageNumber,
          this.rows,
          statusId,
          filtertext,
          ctAction
        )
        .subscribe((a) => {
          this.parameteters = a.items;
          this.totalRecords = a.meta.totalItems;
          this.loading = false;
          this.itemsPerPage = a.meta.itemsPerPage;
        });
    }, 1);
  };

  onCAChange(event: any) {
    this.onSearch();
  }

  statusClick(event: any, object: Assessment) {
    this.router.navigate(['/app/qc/detail'], {
      queryParams: { id: object.id, flag: object.qaStatus },
    });
  }
}
