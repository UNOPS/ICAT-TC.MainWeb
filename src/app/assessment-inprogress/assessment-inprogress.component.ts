import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MasterDataService } from 'app/shared/master-data.service';
import { LazyLoadEvent } from 'primeng/api';
import { Assessment, AssessmentControllerServiceProxy, ServiceProxy } from 'shared/service-proxies/service-proxies';

@Component({
  selector: 'app-assessment-inprogress',
  templateUrl: './assessment-inprogress.component.html',
  styleUrls: ['./assessment-inprogress.component.css']
})
export class AssessmentInprogressComponent implements OnInit {


  loading: boolean;
  totalRecords: number = 0;
  rows: number = 10;
  last: number;
  searchBy: any = {
    text: null,
    sector: null,
    status: null,
    mitigationAction: null,
    editedOn: null,
  };

  assesments: Assessment[];


  constructor(
    private router: Router,
    private serviceProxy: ServiceProxy,
    private assessmentProxy: AssessmentControllerServiceProxy,
    public masterDataService: MasterDataService,
  ) { }


  ngOnInit(): void { 
    let event: any = {};
    event.rows = this.rows;
    event.first = 0;

    this.loadgridData(event);
  }

  loadgridData = (event: LazyLoadEvent) => {
    let filterText = this.searchBy.text ? this.searchBy.text : '';
    let pageNumber = event.first === 0 || event.first === undefined ? 1 : (event.first / (event.rows === undefined ? 10 : event.rows)) + 1;
    this.rows = event.rows === undefined ? 10 : event.rows;

    this.assessmentProxy.assessmentInprogress(pageNumber,this.rows,filterText).subscribe(res => {
        this.assesments=res.items;
        this.totalRecords= res.meta.totalItems
      }
      )
  }

  onSearch() {

    let event: any = {};
    event.rows = this.rows;
    event.first = 0;

    this.loadgridData(event);
  }

  detail(assessment: Assessment) {
    if (assessment.tool =="CARBON_MARKET"){
      this.router.navigate(['app/carbon-market-tool/edit'], {  
      queryParams: { id: assessment.id,isEdit:assessment.isDraft},  
      });
    }
    if (assessment.tool =="PORTFOLIO"){
      this.router.navigate(['app/portfolio-tool'], {  
      queryParams: { id: assessment.id,isEdit:assessment.isDraft},  
      });
    }

    if (assessment.tool =="INVESTOR"){
      this.router.navigate(['app/investor-tool-new'], {  
      queryParams: { id: assessment.id,isEdit:assessment.isDraft},  
      });
    }
    

  }

}