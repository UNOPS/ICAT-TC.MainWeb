import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Country, Institution, InstitutionCategory, InstitutionCategoryControllerServiceProxy, InstitutionControllerServiceProxy, InstitutionType, InstitutionTypeControllerServiceProxy, Sector, SectorControllerServiceProxy, ServiceProxy, User, UserType } from 'shared/service-proxies/service-proxies';
import decode from 'jwt-decode';
import { NgForm } from '@angular/forms';
import { GuidanceVideoComponent } from 'app/guidance-video/guidance-video.component';
import { DialogService } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-institution',
  templateUrl: './institution.component.html',
  styleUrls: ['./institution.component.css']
})
export class InstitutionComponent implements OnInit {

  isSaving: boolean = false;
  insName:boolean =false;
  institution: Institution = new Institution();
  sectorList: Sector[] = [];
  typeList: InstitutionType[] = [];
  selectedTypeList: InstitutionType[] = [];
  selectedTypeList1: InstitutionType[] = [];
  categoryList: InstitutionCategory[] = [];
  institutionId: number = 0;
  title: string;
  user: User = new User();
  userId: number = 0;
  userType: UserType = new UserType();
  type: InstitutionType = new InstitutionType();
  Deactivate: string = "Deactivate";
  deletedAt: Date;
  isNew: boolean = true;

  intype: InstitutionType = new InstitutionType();
  insector: Sector;
  country: Country;
  countryId: number;

  incategory: InstitutionCategory;
  inname: string;
  inmail: string;
  intelephoneNumber: string;
  indescription: string;
  inaddress: string;

  
  sectorAdminId: number = 2;
  institutionAdminId: number = 0;

  rejectComment: string;
  rejectCommentRequried: boolean;
  savedInstitution: Institution;
  statusUpdate = 0;
  @ViewChild('op') overlay: any;
  usrrole: any;
  sectorId: any;
  userSectorId:number = 0;
  dataCollectionModuleStatus:number;
  internalTeam:boolean = false;

  constructor(private serviceProxy: ServiceProxy,
    private confirmationService: ConfirmationService,
    private route: ActivatedRoute,
    private institutionProxy: InstitutionControllerServiceProxy,
    private institutionTypeProxy: InstitutionTypeControllerServiceProxy,
    private institutionCatProxy: InstitutionCategoryControllerServiceProxy,
    private router: Router,
    private messageService: MessageService,
    private sectorProxy: SectorControllerServiceProxy,
    protected dialogService: DialogService,
    private cdr: ChangeDetectorRef) { }

    ngAfterViewInit(): void {
      this.cdr.detectChanges();
    }

    OnShowOerlay() {
      this.rejectComment = '';
      this.rejectCommentRequried = false;
    }
  

  ngOnInit(): void {

    
    const token = localStorage.getItem('ACCESS_TOKEN')!;
    const tokenPayload = decode<any>(token);
    this.usrrole = tokenPayload.role.code;
    this.sectorId = tokenPayload.sectorId;
    this.countryId = tokenPayload['countryId'];

    if(this.usrrole == "Sector Admin" || this.usrrole =="MRV Admin"){
      this.internalTeam = true
    }

    
    this.route.queryParams.subscribe((params => {
      this.institutionId = params['id'];


      if (this.institutionId && this.institutionId > 0) {
        this.isNew = false;
        this.institutionProxy.getInstitutionById(
            this.institutionId
          ).subscribe((res) => {
            this.institution = res;

            this.intype = this.institution?.type;
          })
      }
    }));

    let fil : string[] = new Array()
    fil.push(('id||$eq||' + 4))

    this.institutionTypeProxy
    .getInstitutionType( 4)
    .subscribe((res: any) => {
    
      this.selectedTypeList = res;
        if (this.usrrole == "Country User") {

        this.selectedTypeList1 = this.selectedTypeList.filter((o: any) => o.name != "UNFCCC Focal Point" && o.name != "NDC Unit" && o.name != "National Institution" && o.name != "Data Collection Team" && o.name != "QC Team");
      }
      else if (this.usrrole == "Data Collection Team") {
        this.selectedTypeList1 = this.selectedTypeList.filter((o: any) => o.name == "Data provider");
      }
      else if (this.usrrole == "Country Admin") {
        this.selectedTypeList1 = this.selectedTypeList;
      }
      else {

        this.selectedTypeList1 = this.selectedTypeList.filter((o: any) => o.name != "UNFCCC Focal Point" && o.name != "NDC Unit");
      }
    });


    this.institutionCatProxy
    .getInstitutionType()
    .subscribe((res: any) => {
      this.categoryList = res;
    });


    let filter: string[] = new Array();

    if (this.sectorId) {
      filter.push('id||$eq||' + this.sectorId)
    }

    this.sectorProxy.getSectorDetails(1,100,'').subscribe((res:any) =>{
      this.sectorList = res.items;
    })


  }


  onInstitutionChange(event:any)
{
  if(['Data Collection Team','QC Team','National Institution'].includes(event.name)){

  }
  else{
    this.inname = ""
  }
}


onInstitutionNameChange(event:any){
  this.institutionProxy.getInsti(
    event,
    this.userId,
  ).subscribe((a) => {
    if(a.length>0 && event.length>0){
      this.insName=true;
    }
    else this.insName=false;
    });
}


async saveForm(formData: NgForm) {


  if (formData.valid) {
    let country = new Country();
    country.id = this.countryId;
    let institution = new Institution();
    if (this.insector) {
      let secternew = new Sector();
      secternew.id = this.insector.id;
      institution.sector = secternew;
    }

    institution.name = this.inname;
    institution.description = this.indescription;
    let inscat = new InstitutionCategory
    inscat.id =this.incategory.id;
    institution.category = inscat;
    let instype = new InstitutionType();
    this.intype.id = this.selectedTypeList[0].id
    instype.id =this.intype.id;
    institution.type = instype;
    institution.address = this.inaddress;
    let inscountry = new Country
    inscountry.id =country.id;
    institution.country = inscountry;
    institution.telephoneNumber = this.intelephoneNumber;
    institution.email = this.inmail;


    if (institution.sector?.id) {
      let sector = new Sector();
      sector.id = this.insector.id;
      this.institution.sector = sector;
    }



    if (this.institution.type) {
      let type = new InstitutionType();
      type.id = this.intype.id;
      this.institution.type = type;
    }

    if (this.institution.category) {
      let category = new InstitutionCategory();
      category.id = this.incategory.id;
      this.institution.category = category;
    }

    if (institution.id !== 0) {


      await this.institutionProxy.create(institution)
        .subscribe(
          (re) => {
            
            this.messageService.add({
              severity:'success', 
              summary:'Success', 
              detail:institution.name +' saved successfully',  
              closable: true,});
           
            
          },

          (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error.',
              detail: 'Internal server error, please try again.',
              sticky: true,
            });
          }
          
        );
        setTimeout(() => {
          this.onBackClick();    
        },1000);
    }

  } else {
    alert('Fill all the mandetory fields')
  }
}



deleteInstitution(institution: Institution) {
  this.confirmationService.confirm({
    message: 'confirm you want to deactivate institution, this action will also deactivate users associated with the institution?',
    accept: () => {
      this.updateStatus(institution);
      this.institutionProxy
        .deactivateInstitution(institution.id)
        .subscribe((res) => {

          this.confirmationService.confirm({

            accept: () => {

            }
          })

        })

    },
  });
}



updateStatus(institution: Institution) {


  let statusUpdate = 1;
  this.institution.status = statusUpdate;


  let sector = new Sector();
  sector.id = this.institution.sector?.id;
  this.institution.sector = sector;


  if (this.institution.type) {
    let type = new InstitutionType();
    type.id = this.institution.type?.id;
    this.institution.type = type;
  }

  if (this.institution.category) {
    let category = new InstitutionCategory();
    category.id = this.institution.category?.id;
    this.institution.category = category;
  }

  this.institutionProxy.update( institution)
    .subscribe((res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Deactivated successfully',
          detail:
            institution.status === 1
              ? this.institution.name + ' is deactivated' : '',
          closable: true,
        });
    },
      (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error.',
            detail: 'Failed to deactivate, please try again.',
            sticky: true,
          });
      }
    );

}

activateInstitution(institution: Institution) {

  if (institution.status == 1) {
    this.statusUpdate = 0;
  }
  else {
    this.statusUpdate = 1;
  }
  this.institution.status = this.statusUpdate;


  let sector = new Sector();
  sector.id = this.institution.sector?.id;
  this.institution.sector = sector;


  if (this.institution.type) {
    let type = new InstitutionType();
    type.id = this.institution.type?.id;
    this.institution.type = type;
  }

  if (this.institution.category) {
    let category = new InstitutionCategory();
    category.id = this.institution.category?.id;
    this.institution.category = category;
  }


  this.institutionProxy.update( institution)
    .subscribe((res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Activated successfully',
          detail:
            institution.status === 0
              ? this.institution.name + ' is activated' : '',

          closable: true,
        });
    },
      (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error.',
            detail: 'Failed to activate, please try again.',
            sticky: true,
          });
      }
    );

}



onConfirm() {
  this.messageService.clear('c');
}

onReject() {
  this.messageService.clear('c');
}

showConfirm() {
  this.messageService.clear();
  this.messageService.add({
    key: 'c',
    sticky: true,
    severity: 'warn',
    summary: 'Are you sure?',
    detail: 'Confirm to proceed',
  });
}


onBackClick() {
  this.router.navigate(['/app/institutionlist']);
}

edit(institution: Institution) {
  this.router.navigate(['edit-institution'], {
    queryParams: { id: institution.id }
  });
}

watchVideo(){
  let ref = this.dialogService.open(GuidanceVideoComponent, {
    header: 'Guidance Video',
    width: '60%',
    contentStyle: {"overflow": "auto"},
    baseZIndex: 10000,
    data: {
      sourceName: 'institution',
    },
  });

  ref.onClose.subscribe(() => {
    
  })
}

}
