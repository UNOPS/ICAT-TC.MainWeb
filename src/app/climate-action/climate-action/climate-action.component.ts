import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Location } from '@angular/common';
import { } from 'googlemaps';
import {
  Country,
  Documents,
  DocumentsDocumentOwner,
  FinancingScheme,
  AggregatedAction as Ndc,
  NdcControllerServiceProxy,
  ClimateAction as Project,
  ProjectApprovalStatus,
  ProjectControllerServiceProxy,
  ProjectOwner,
  ProjectStatus,
  Sector,
  ServiceProxy,
  ActionArea as SubNdc,
  User,
  SectorControllerServiceProxy,
  UsersControllerServiceProxy,
  Barriers,
  MethodologyAssessmentControllerServiceProxy,
  BarriersCategory,
  PolicyBarriers,
  CountryControllerServiceProxy,
  AggregatedAction,
  ActionArea,
  Characteristics,
  PolicySector,
  DocumentControllerServiceProxy,
  AllBarriersSelected,
  BarrierSelected,
  AllPolicySectors,
  ProjectApprovalStatusControllerServiceProxy,
  ProjectStatusControllerServiceProxy,
  AddPolicySector

} from 'shared/service-proxies/service-proxies';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import decode from 'jwt-decode';
import { FieldNames, MasterDataService } from 'app/shared/master-data.service';
import { GlobalArrayService } from 'app/shared/global-documents/global-documents.service';
import { GuidanceVideoComponent } from 'app/guidance-video/guidance-video.component';
import { DialogService } from 'primeng/dynamicdialog';


@Component({
  selector: 'app-climate-action',
  templateUrl: './climate-action.component.html',
  styleUrls: ['./climate-action.component.css']
})
export class ClimateActionComponent implements OnInit  {
  isSaving: boolean = false;
  project: Project = new Project();
  policyBar: PolicyBarriers[] = [];
  selectedcitie: any = {};
  ndcList: Ndc[];
  SubndcList: SubNdc[] = [];
  options: any;
  relatedItem: Project[] = [];
  exsistingPrpject: boolean = false;
  countryList:Country[]= [];
  projectOwnerList: ProjectOwner[] = [];
  projectStatusList: ProjectStatus[] = [];
  sectorList: Sector[] = [];
  financingSchemeList: FinancingScheme[] = [];
  documents: Documents[] = [];
  documentsDocumentOwner: DocumentsDocumentOwner =
    DocumentsDocumentOwner.Project;
  editEntytyId: number = 0;
  anonymousEditEntytyId: number = 0;
  documentOwnerId: number = 0;
  proposeDateofCommence: any ='';
  dateOfCompletion: any='';
  dateOfImplementation:any='';

  isLoading: boolean = false;
  isDownloading: boolean = true;
  isDownloadMode: number = 0;
  flag: number = 0;
  isCity: number = 0;
  isMapped: number;
  likelyHood: number;
  isLikelyhoodFromDb: number;
  isPoliticalPreferenceFromDb: number;
  isFinancialFeciabilityFromDb: number;
  isAvailabiltyOfTEchFromDb: number;
  isPoliticalPreference: number = 1;
  isFinancialFeciability: number = 1;
  isAvailabiltyOfTEch: number = 1;
  selectedProject: Project;
  originalNdc: string = '';
  originalSubNdc: string = '';
  commentForJustification: string = '';
  originalApprovalStatus: string = '';
  updatedApprovalStatus: string = '';
  historyList: any[] = [];
  ndcupdatehistoryList: any[] = [];
  statusupdatehistoryList: any[] = [];
  proposedDate: string = '';
  isActionButtonSectionEnabled: boolean = false;
  userName: string = '';
  drCommentRequried: boolean;
  drComment: string;
  rejectCommentRequried: boolean;
  rejectComment: string;
  loggedUser: User;
  fullname: string = '';
  isGHG: number = 0;
  selectedApproch: string;
  barriers: Barriers[];
  setbarriers: any[] = [];
  selectbarriers: any;
  category: BarriersCategory[];
  selectCategory: any;
  approachList: string[] = ['AR1', 'AR2', 'AR3', 'AR4', 'AR5'];
  typeofAction: string[] = ['Investment','Carbon market','General tool']
  levelOfImplementation: any[] = [];
  geographicalAreaCovered: any[] = [];
  characteristicsList: Characteristics[] = [];
  
  barrierBox:boolean=false;

  barrierSelected:BarrierSelected= new BarrierSelected();
  finalBarrierList :BarrierSelected[]=[];

  policySectorArray:PolicySector[]=[]
  sectornames:any[]=[];
  barrierArray:PolicyBarriers[]
  sectorsJoined :string='';

  finalSectors:Sector[]=[]
  userRole:any='';
  isExternalUser:boolean=false;
  showUpload:boolean=true;
  showDeleteButton:boolean=true

  proposingUser:User

  selectedDocuments: Documents[] = [];
  counID: number;
  a = this.project.otherRelatedActivities
  isSector: boolean = false;
  loadingCountry:boolean = false
  loadProjectStatus:boolean = false
  @ViewChild('gmap') gmap: any;
  @ViewChild('op') overlay: any;
  @ViewChild('opDR') overlayDR: any;
  projectApprovalStatus: ProjectApprovalStatus[];
  overlays: any[];

  title = 'htmltopdf';
  wid: number;
  hgt: number;
  textdlod: any = 'Downloaded date ' + moment().format('DD/MM/YYYY HH:mm:ss');

  getUserEnterdCountry: any = '';
  disbaleNdcmappedFromDB: number;
  @ViewChild('pdfTable') pdfTable: ElementRef;
  lastId: any;
  int_id_sectors='Sector';
  int_id_year='YYYY';
  int_id_country='Country';
  tooltips: any = {}
  editMode:boolean = false
  fieldNames = FieldNames

  constructor(
    private serviceProxy: ServiceProxy,
    private countryProxy: CountryControllerServiceProxy,
    private confirmationService: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private messageService: MessageService,
    private projectProxy: ProjectControllerServiceProxy,
    private sectorProxy: SectorControllerServiceProxy,
    private ndcProxy: NdcControllerServiceProxy,
    private asses: MethodologyAssessmentControllerServiceProxy,
    private cdref: ChangeDetectorRef ,
    public masterDataService: MasterDataService,
    private docArrayforSave:GlobalArrayService,
    private docService: DocumentControllerServiceProxy,
    private userproxy:UsersControllerServiceProxy,
    private projectApprovalStatusControllerServiceProxy: ProjectApprovalStatusControllerServiceProxy,
    private projectStatusControllerServiceProxy: ProjectStatusControllerServiceProxy,
    protected dialogService: DialogService,
    
  ) 
  { }

  async ngOnInit(): Promise<void> {
    this.levelOfImplementation = this.masterDataService.level_of_implemetation;
    this.geographicalAreaCovered= this.masterDataService.level_of_implemetation;
    const token = localStorage.getItem('ACCESS_TOKEN')!; 
    this.userRole =decode<any>(token).role?.code;
    const countryId = token ? decode<any>(token).countryId : 0;
    this.counID = countryId;
    if(this.userRole =='External'){
      this.getCountryList()
    }

    this.tooltips = {
      id: 'To be assigned by the tool',
      start_date: 'State the date that the intervention comes into effect. Not to be confused with the date new legislation is passed in the case of policies',
      end_date: 'State the date the intervention ceases, such as the date a tax is no longer levied or the end date of an incentive scheme with a limited duration not the date that the policy/action no longer has an impact',
      entity: 'List the entities that implement the intervention, including the role of various local, subnational, national, international or any other entities',
      objectives: 'State the intended impacts the intervention intends to achieve (e.g., the purpose stated in the legislation or regulation), including specific goals for GHG emission reductions and sustainable development impacts where available',
      related: 'List other Interventions or actions that may interact with the Intervention or action assessed',
      reference: 'Provide a link or full reference to access further, detailed information about the intervention',
      geo: 'Where is the policy applied?',
      objective: 'State the intended impacts the intervention intends to achieve (e.g., the purpose stated in the legislation or regulation), including specific goals for GHG emission reductions and sustainable development impacts where available)'
    }
 ;
    let filterUser: string[] = [];
    filterUser.push('username||$eq||' + this.userName);
    this.sectorList = await this.sectorProxy.findAllSector().toPromise()
    if (countryId > 0) {
    } 
    this.asses.findAllBarriers().subscribe((res: any) => {
      this.barriers = res;
    })

    this.asses.findByAllCategories().subscribe((res: any) => {
      this.category = res;
    })

    
 
    this.asses.findAllCharacteristics().subscribe((res3: any) => {
      this.characteristicsList = res3;

    });

    this.userName = localStorage.getItem('USER_NAME')!
    this.userproxy.findUserByEmail(this.userName).subscribe((res3: any) => {
      this.proposingUser = res3;

    });

     await this.projectProxy.getLastID().subscribe(async (res: any) => {
      this.lastId = (res[0].id +1).toString().padStart(5, '0');
     });
   

    this.route.queryParams.subscribe(async (params) => {
    
      this.editEntytyId = 0;
      this.anonymousEditEntytyId = 0;
      this.documentOwnerId = 0;
      this.editEntytyId = params['id'];
      this.anonymousEditEntytyId = params['anonymousId'];
      if (this.editEntytyId > 0) {
        this.documentOwnerId = this.editEntytyId;
        await this.docService
        .getDocuments(this.documentOwnerId, this.documentsDocumentOwner)
        .subscribe(
          async (res) => {
            this.selectedDocuments =await  res;
          },
          
        );
      } else if (this.anonymousEditEntytyId > 0) {
        this.documentOwnerId = this.anonymousEditEntytyId;
      }

      this.flag = params['flag'];
      if (this.flag == 1) {
        this.isDownloading = false;

      }else{
        
        this.project=new Project();
        this.showUpload=true
        this.showDeleteButton=true
        
        this.countryProxy
        .getCountry(countryId).subscribe((res) => {
         
          if(this.userRole=='External'){
            this.isExternalUser=true;
            this.project.country= res
            this.loadingCountry = true
            this.project.projectApprovalStatus = new ProjectApprovalStatus();
            this.makeInterventionID()
            

          }else{
            this.countryList.push(res)
            this.project.country =res;
            this.isSector = true;
            this.loadingCountry =true;
          }
          
        });
        this.proposeDateofCommence=''
        this.dateOfImplementation =''
        this.dateOfCompletion =''
      }
    });
    
    
    if (countryId) {
      this.countryProxy
        .getCountry(countryId)
        .subscribe((res) => {
          if(this.userRole=='External'){
            this.isExternalUser=true;
            this.int_id_country='External';
            this.makeInterventionID();
          }else{
          this.countryList.push(res);
          this.project.country =res;
          this.isSector = true;
          this.int_id_country =res.code;
          this.makeInterventionID();
          }
          
        });
    } else {
    }

    this.options = {
      center: { lat: 18.7322, lng: 15.4542 },
      zoom: 2,
    };

    this.project.longitude = 0.0;
    this.project.latitude = 0.0;

    let countryaFilter: string[] = new Array();

    countryaFilter.push('country.id||$eq||' + 1);

    this.projectStatusControllerServiceProxy.getAllProjectStatus()
      .subscribe((res: any) => {
        this.projectStatusList = res;
      });


        if (this.editEntytyId && this.editEntytyId > 0) {
          this.showUpload=false;
          this.showDeleteButton=false;
          this.projectProxy.getIntervention(this.editEntytyId)
            .subscribe(async (res1) => {
              this.project = res1;
              this.loadProjectStatus= true
              this.loadingCountry= true
              
              this.isCity =res1.isCity;
              const latitude = parseFloat(this.project.latitude + '');
              const longitude = parseFloat(this.project.longitude + '');
              await this.addMarker(longitude, latitude);

              this.likelyHood = this.project.likelyhood;
              this.isPoliticalPreference = this.project.politicalPreference;
              this.isFinancialFeciability = this.project.financialFecialbility;
              this.isAvailabiltyOfTEch = this.project.availabilityOfTechnology;
              this.originalApprovalStatus =
                this.project.projectApprovalStatus == undefined
                  ? 'Proposed'
                  : this.project.projectApprovalStatus?.description;
              this.proposedDate = this.project.proposeDateofCommence.toString();
              this.isLikelyhoodFromDb = this.project?.likelyhood;
              this.isPoliticalPreferenceFromDb =
                this.project?.politicalPreference;
              this.isFinancialFeciabilityFromDb =
                this.project?.financialFecialbility;
              this.isAvailabiltyOfTEchFromDb =
                this.project.availabilityOfTechnology;



              var sector = this.sectorList.find(
                (a) => a.id === this.project?.sector?.id
              );
              this.onSectorChange(true);
              this.proposeDateofCommence = new Date(
                this.project.proposeDateofCommence?.year(),
                this.project.proposeDateofCommence?.month(),
                this.project.proposeDateofCommence?.date()
              );
              this.dateOfImplementation = new Date(
                this.project.dateOfImplementation?.year(),
                this.project.dateOfImplementation?.month(),
                this.project.dateOfImplementation?.date()
              );

              this.dateOfCompletion = new Date(
                this.project.dateOfCompletion?.year(),
                this.project.dateOfCompletion?.month(),
                this.project.dateOfCompletion?.date()
              );

   

              this.isLoading = false;
              if (this.flag == 1) {
                this.originalNdc = this.project.aggregatedAction?.name;
                this.originalSubNdc = this.project.actionArea?.name;
              }

              let histryFilter: string[] = new Array();
              histryFilter.push('project.id||$eq||' + this.project.id);

              this.projectProxy.findPolicyBarrierData(this.editEntytyId ).subscribe( (res) => {
                  this.barrierArray =res;

                })
              this.projectProxy.findPolicySectorData(this.editEntytyId ).subscribe( (res) => {
                this.policySectorArray =res;
                for(let x of res){
                  this.finalSectors.push(x.sector)
                  this.sectornames.push(x.sector.name)
                }
                 this.sectorsJoined=this.sectornames.join(', ')
                 })
              setTimeout(() => {
              }, 3000);
              

            });
        }
       
        if (this.anonymousEditEntytyId && this.anonymousEditEntytyId > 0) {
   
        }

    this.projectApprovalStatusControllerServiceProxy.getAllProjectApprovalStatus().subscribe((res: any) => {
        this.projectApprovalStatus = res;
      });


    if (this.anonymousEditEntytyId && this.anonymousEditEntytyId != 0) {
      let docFilter: string[] = new Array();

      docFilter.push('documentOwnerId||$eq||' + this.anonymousEditEntytyId);
      this.serviceProxy
        .getManyBaseDocumentControllerDocuments(
          undefined,
          undefined,
          docFilter,
          undefined,
          undefined,
          undefined,
          1000,
          0,
          0,
          0
        )
        .subscribe((res: any) => {
          this.selectedDocuments = res.data;
        });
    }
  
  }

  async getCountryList(){
    await this.countryProxy.findall().subscribe((res2) => {
      this.countryList =[]
      this.countryList=res2;
    })
  }
  onImplementatonYearChange(date:Date){
    this.int_id_year=date.getFullYear().toString()
    this.makeInterventionID()
  }
   makeInterventionID(){
    if(!this.editEntytyId && this.loadingCountry){
      if(!this.isExternalUser){
        this.int_id_country=this.project.country.code;
      }
      
      if(this.finalSectors.length==1){
        this.int_id_sectors=this.finalSectors[0].name;
      }
      else if(this.finalSectors.length>1){
        this.int_id_sectors='Multi';
      }
      else if(this.finalSectors.length==0){
        this.int_id_sectors='Sector';
      }
      if(this.isExternalUser){
        this.int_id_country='External'
      }
      this.project.intervention_id=this.int_id_country+'-'+ this.int_id_sectors+'-'+this.int_id_year+'-'+this.lastId
  
    }
   
      
    
  }
  changInstitute(event: any) {
  }
  uploadedfiles(){
  }

  saveForm(formData: NgForm) {
    if (this.exsistingPrpject) {
      return;
    }
    if (this.project.sector) {
      let sector = new Sector();
      sector.id = this.project.sector.id;
      sector.name = this.project.sector.name;
      this.project.sector = sector;
    }


    this.project.proposeDateofCommence = moment(new Date());
    this.project.dateOfImplementation = moment(this.dateOfImplementation);
    this.project.dateOfCompletion = moment(this.dateOfCompletion);

    if (this.project.aggregatedAction) {
      let ndc = new Ndc();
      ndc.id = this.project.aggregatedAction?.id;
      ndc.name = this.project.aggregatedAction?.name;
      this.project.aggregatedAction = ndc;
    }

    if (this.project.actionArea) {
      let subned = new SubNdc();
      subned.id = this.project.actionArea?.id;
      subned.name = this.project.actionArea?.name;
      this.project.actionArea = subned;
    }
    if (formData.form.valid && this.project.id > 0) {
      if (this.anonymousEditEntytyId > 0) {
        let prAprSts = new ProjectApprovalStatus();
        prAprSts.id = 4;
      } else {
        this.serviceProxy
          .updateOneBaseProjectControllerClimateAction(this.project.id, this.project)
          .subscribe(
            (res) => {
              this.isSaving = true;
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Intervention  has been updated successfully ',
                closable: true,
              });
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
      }
    } else {
      if (formData.form.valid) {
        let projaprovalstatus = new  ProjectApprovalStatus()
        projaprovalstatus.id =4
        this.project.projectApprovalStatus= projaprovalstatus; 
        this.messageService.clear();
        this.project.aggregatedAction =new AggregatedAction()
        this.project.aggregatedAction.id =1;
        this.project.actionArea =new ActionArea()
        this.project.actionArea.id =1;
        this.project.sector = new Sector()
        this.project.sector.id =1;
        this.project.isCity =this.isCity
        this.project.user = new User()
        this.project.user.id =this.proposingUser.id;
        let savingCountry = new Country()
        savingCountry.id = this.project.country.id;
        savingCountry.name = this.project.country.name;
        this.project.country = savingCountry
          this.projectProxy.createNewCA(this.project)
          .subscribe(
            (res) => {
              let docUpdate:any={
                
              };
              docUpdate.ids=this.docArrayforSave.getArray();
              docUpdate.projectID=res.id;
              this.docService.updateDocOwner(docUpdate).subscribe((res) => {
               
              })

              this.docService.getDocuments(res.id, this.documentsDocumentOwner).subscribe(res => 
                this.selectedDocuments = res
              )

              for (let sec of this.finalSectors) {
                let ps = new PolicySector();
                ps.intervention = res
                ps.sector =sec
                
                this.policySectorArray.push(ps);
              }
              for(let x of this.policySectorArray){
                this.sectornames.push(x.sector.name)
              }
              this.sectorsJoined = ''
              this.sectorsJoined = this.sectornames.join(', ')

              let allSectors= new AllPolicySectors();
              allSectors.allSectors =this.policySectorArray;
              this.projectProxy.policySectors(allSectors).subscribe((res) => {
               
              })
              this.isSaving = true;
              if (this.finalBarrierList.length > 0) {
                let allBarriersSelected = new AllBarriersSelected()
                allBarriersSelected.allBarriers =this.finalBarrierList
                allBarriersSelected.climateAction =res;
                this.projectProxy.policyBar(allBarriersSelected).subscribe((res) => {
                  this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Intervention  has been saved successfully',
                    closable: true,
                  },
                  
                  
                  );
                },
                (err) => {
                  this.messageService.add({
                    severity: 'error',
                    summary: 'Error.',
                    detail: 'Internal server error in policy barriers',
                    sticky: true,
                  });
                })
              } else {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Success',
                  detail: 'Intervention  has been saved successfully',
                  closable: true,
                });
              }
              
             
             
            },

            (err) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error.',
                detail: 'Internal server error',
                sticky: true,
              });
            }
          );

      }
    }
  }
  getNext(){
    const nextNumber = this.lastId + 1;

    const paddedNumber = nextNumber.toString().padStart(4, '0');
    const nextId = this.project.country?.code +this.dateOfImplementation+ paddedNumber;

    return nextId
  }

  onnameKeyDown(event: any) {

    let skipWord = ['of', 'the', 'in', 'On', '-', '_', '/'];
    let searchText = this.removeFromString(
      skipWord,
      this.project.policyName
    ).trim();

    if (!searchText || searchText?.length < 4) {
      this.relatedItem = [];
      return;
    }

    this.exsistingPrpject = false;

    let words = searchText.split(' ');

    let orfilter: string[] = new Array();
    let filter: string[] = new Array();
    if (this.counID > 0) {
      filter.push('country.id||$eq||' + this.counID);
    }


    filter.push('climateActionName||$cont||' + searchText);

    this.serviceProxy
      .getManyBaseProjectControllerClimateAction(
        undefined,
        undefined,
        filter,
        undefined,
        undefined,
        undefined,
        10,
        0,
        0,
        0
      )
      .subscribe((res) => {
        if (this.project.policyName && res) {
          this.relatedItem = res.data;
          
          if (
            this.relatedItem.find(
              (a) =>
                a.policyName.toLocaleLowerCase() ===
                this.project.policyName.toLocaleLowerCase()
            )
          ) {
            this.exsistingPrpject = true;
          }
        } else {
          this.relatedItem = [];
        }
      });

    setTimeout(() => {
      this.setMarkerOnUpdateInit();
    }, 3000);
  }
 
  onCountryChnage() {
    this.getUserEnterdCountry = this.project.country;
    this.onSectorChange(event);

    this.sectorProxy.getCountrySector(this.project.country.id).subscribe((res: any) => {
      this.sectorList = res;
    });
  }

  onSectorChange(event: any) {
    this.makeInterventionID();
  }
  onNdcChnage(event: any): void {
  }

  escape(s: string) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  }

  removeFromString(arr: string[], str: string) {
    let escapedArr = arr.map((v) => escape(v));
    let regex = new RegExp(
      '(?:^|\\s)' + escapedArr.join('|') + '(?!\\S)',
      'gi'
    );
    return str.replace(regex, '');
  }

  setCoordinatesToProject = (longitude: number, latitude: number) => {
    this.project.latitude = latitude;
    this.project.longitude = longitude;
  };

  async handleMapClick(event: any) {
    if (!this.editEntytyId || this.editEntytyId == 0) {
      const latitude = event.latLng.lat();
      const longitude = event.latLng.lng();
      await this.addMarker(longitude, latitude);
      this.setCoordinatesToProject(longitude, latitude);

      let map = this.gmap.getMap();
      this.updateMapBoundaries(map, longitude, latitude);
    }
  }

  handleMarkerDragEnd(event: any) {
    if (!this.editEntytyId || this.editEntytyId == 0) {
      const latitude = event.originalEvent.latLng.lat();
      const longitude = event.originalEvent.latLng.lng();
      this.setCoordinatesToProject(longitude, latitude);

      let map = this.gmap.getMap();
      this.updateMapBoundaries(map, longitude, latitude);
    }
  }

  async setMarkerOnUpdateInit() {
    const latitude = Number(this.project.latitude);
    const longitude = Number(this.project.longitude);
    await this.addMarker(longitude, latitude);
    let map = this.gmap.getMap();
    this.updateMapBoundaries(map, longitude, latitude);
  }

  updateMapBoundaries = (map: any, longitude: any, latitude: any) => {
    if (longitude && latitude) {
      map.setCenter({ lat: latitude, lng: longitude });
      if (map.getZoom() < 10) {
        map.setZoom(10);
      }

      if (!map.getZoom()) {
        map.setZoom(10);
      }
    } else {
      map.setCenter({ lat: 9, lng: 80 });
      map.setZoom(6);
      this.overlays = [];
    }
  };

  async addMarker(longitude: number, latitude: number) {
    var marker = await new google.maps.Marker({
      position: { lat: latitude, lng: longitude },
      title: this.project.policyName,
      draggable: true,
    });
    this.overlays = [marker];
  }

  onLatitudeChange = async (event: any) => {
    let map = this.gmap.getMap();
    if (event.value && this.project.longitude) {
      const latitude = Number(event.value);
      const longitude = Number(this.project.longitude);
      await this.addMarker(longitude, latitude);
      this.updateMapBoundaries(map, longitude, latitude);
    } else {
      this.updateMapBoundaries(map, null, null);
    }
  };

  onLongitudeChange = async (event: any) => {
    let map = this.gmap.getMap();
    if (event.value && this.project.latitude) {
      const latitude = Number(this.project.latitude);
      const longitude = Number(event.value);
      await this.addMarker(longitude, latitude);
      this.updateMapBoundaries(map, longitude, latitude);
    } else {
      this.updateMapBoundaries(map, null, null);
    }
  };

  back() {
    this.location.back();
  }
  async edit(label: string){
    if (label === 'Edit') {
      this.editMode =true;
    }
    else {
      this.editMode =false;
      this.project.geographicalAreaCovered = this.project.geographicalAreaCovered;
      this.project.levelofImplemenation = this.project.levelofImplemenation;
      this.project.dateOfCompletion= this.dateOfCompletion
      this.project.dateOfImplementation =this.dateOfImplementation;
      
      let obj = new AddPolicySector
      obj.id =this.project.id;
      obj.sector=this.finalSectors;
      await this.projectProxy.deletePolicySector(this.project.id).toPromise();
      await this.projectProxy.addPolicySector(obj).toPromise();

      this.sectornames=[]
      for(let x of this.finalSectors){
        this.sectornames.push(x.name)
      }
      this.sectorsJoined = ''
      this.sectorsJoined = this.sectornames.join(', ')

      this.projectProxy.updateOneClimateAction(this.project)
      .subscribe(
        (res) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Intervention update successfully.',
            closable: true,
          });
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

      

    }
  }

  confirmBack(label: string) {
    if (label === 'back') {
      this.location.back();

    }
    else {
      this.confirmationService.confirm({
        message: (label == 'cancel' ? 'Your filled data will be lost. ' : '') + 'Are you sure that you want to proceed?',
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.location.back();
        },
        reject: (type: any) => {

        }
      });
    }

  }
  onRowSelect(event: any) {
    this.selectedProject = event;
  }

  onCategoryChange(event: any) {
    this.setbarriers = []
    
      let br = this.barriers.filter((a: any) => event.id == a.barriersCategory.id);
      for (let b of br) {
        this.setbarriers.push(b);
      }
  
}

enableActionButtonsarea() {
  this.isActionButtonSectionEnabled = true;
}

updateProjectApprovalStatus(project: Project, aprovalStatus: number) {
  if (project) {
    
    this.originalApprovalStatus =
      project.projectApprovalStatus === undefined
        ? 'Propose'
        : project.projectApprovalStatus.name;

    if (aprovalStatus == 1) {
      this.updatedApprovalStatus = 'Accept';
    }
    if (aprovalStatus == 2) {
      this.updatedApprovalStatus = 'Reject';
    }
    if (aprovalStatus == 3) {
      this.updatedApprovalStatus = 'Data Request';
    }

    let status = this.projectApprovalStatus.find(
      (a) => a.id === aprovalStatus
    );

    if (aprovalStatus === 1) {
      this.confirmationService.confirm({
        message:
          'Are you sure you want to approve ' +
          project.policyName +
          ' ?',
        accept: () => {
          project.projectApprovalStatus =
            status === undefined ? (null as any) : status;
          this.updateStatus(project, aprovalStatus);
        },
        reject: () => { },
      });
    }
    if (aprovalStatus === 2) {
      this.confirmationService.confirm({
        message:
          'Are you sure you want to reject ' +
          project.policyName +
          ' ?',
        accept: () => {
          project.projectApprovalStatus =
            status === undefined ? (null as any) : status;
          this.updateStatus(project, aprovalStatus);
        },
        reject: () => { },
      });
    }
    if (aprovalStatus === 3) {
      this.confirmationService.confirm({
        message:
          'Are you sure you want to data request ' +
          project.policyName +
          ' ?',
        accept: () => {
          project.projectApprovalStatus =
            status === undefined ? (null as any) : status;
          this.updateStatus(project, aprovalStatus);
        },
        reject: () => { },
      });
    }
  } else {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail:
        'Please check whether Aggregated Actions and Action areas is correctly mapped or not',
      closable: true,
    });
  }
}

updateStatus(project: Project, aprovalStatus: number) {
  let sector = new Sector();
  project.sector = sector;

  project.proposeDateofCommence = moment(this.proposeDateofCommence);

  if (project.aggregatedAction) {
    let ndc = new Ndc();
    ndc.id = project.aggregatedAction?.id;
    project.aggregatedAction = ndc;
  }

  if (project.actionArea) {
    let subned = new SubNdc();
    subned.id = project.actionArea?.id;
    project.actionArea = subned;
  }


  project.politicalPreference = this.isPoliticalPreference;
  project.likelyhood = this.likelyHood;
  project.availabilityOfTechnology = this.isAvailabiltyOfTEch;
  project.financialFecialbility = this.isFinancialFeciability;
  
  let updateProjectApprovalStatus = new ProjectApprovalStatus()
  updateProjectApprovalStatus.id = aprovalStatus;
  project.projectApprovalStatus = updateProjectApprovalStatus;
  let savingCountry = new Country()
  savingCountry.id = project.country.id;
  project.country = savingCountry;
  this.projectProxy
    .createNewCA(project)
  .subscribe(
    (res) => {


      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail:
          aprovalStatus === 1 || aprovalStatus === 2
            ? project.policyName +
              ' is successfully ' +
              (aprovalStatus === 1 ? 'Approved.' : 'Rejected')
            : 'Data request sent successfully.',
        closable: true,
      });
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
}

drWithComment() {
  if (
    this.drComment === '' ||
    this.drComment === null ||
    this.drComment === undefined
  ) {
    this.drCommentRequried = true;
  } else {
    this.selectedProject.projectDataRequsetComment = this.drComment;

    if (this.isMapped != undefined) {
      this.updateProjectApprovalStatus(this.selectedProject, 3);
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail:
          'Please check whether Aggregated Actions and Action Areas is correctly mapped or not',
        closable: true,
      });
    }
  }
}

rejectWithComment() {
  if (
    this.rejectComment === '' ||
    this.rejectComment === null ||
    this.rejectComment === undefined
  ) {
    this.rejectCommentRequried = true;
  } else {
    this.selectedProject.projectRejectComment = this.rejectComment;
  }
}

OnShowOerlayDR() {
  this.drComment = '';
  this.drCommentRequried = false;
}
OnShowOerlay() {
  this.rejectComment = '';
  this.rejectCommentRequried = false;
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

toUpdateNdcs() {

  let sector = new Sector();
  sector.id = this.project.sector.id;
  sector.name = this.project.sector.name;
  this.project.sector = sector;

  this.project.proposeDateofCommence = moment(this.proposeDateofCommence);

  if (this.project.aggregatedAction) {
    this.originalNdc = this.project.aggregatedAction.name;

    let ndc = new Ndc();
    ndc.id = this.project.aggregatedAction?.id;
    ndc.name = this.project.aggregatedAction?.name;
    this.project.aggregatedAction = ndc;
  }

  if (this.project.actionArea) {
    this.originalSubNdc = this.project.actionArea.name;

    let subned = new SubNdc();
    subned.id = this.project.actionArea?.id;
    subned.name = this.project.actionArea?.name;
    this.project.actionArea = subned;
  }



  if (this.project.id > 0) {
    this.serviceProxy
      .updateOneBaseProjectControllerClimateAction(this.project.id, this.project)

  }
}

showDialog(){
  this.barrierBox =true;

}

pushBarriers(barrier:any){
  this.finalBarrierList.push(barrier)
 this.barrierSelected = new BarrierSelected()

}
toDownload() {
  this.isDownloadMode = 1;
  this.isDownloading = true;

  setTimeout(() => {

    var data = document.getElementById('content')!;

    html2canvas(data).then((canvas) => {
      const componentWidth = data.offsetWidth;
      const componentHeight = data.offsetHeight;

      const orientation = componentWidth >= componentHeight ? 'l' : 'p';

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation,
        unit: 'px',
      });

      pdf.internal.pageSize.width = componentWidth;
      pdf.internal.pageSize.height = componentHeight;

      pdf.addImage(imgData, 'PNG', 0, 0, componentWidth, componentHeight);
      pdf.save('download.pdf');
      this.isDownloadMode = 0;
      this.isDownloading = false;
    });
  }, 1);
}

  barriersNameArray(Characteristics:any[]){
    if (Characteristics?.length>0){
      let charArray = Characteristics.map(x=>{return x.name});
      return charArray.join(", ")
    }
    else{
      return "-"
    }
    

  }

  watchVideo() {
    let ref = this.dialogService.open(GuidanceVideoComponent, {
      header: 'Guidance Video',
      width: '60%',
      contentStyle: { "overflow": "auto" },
      baseZIndex: 10000,
      data: {
        sourceName: 'Interventions',
      },
    });

    ref.onClose.subscribe(() => {

    })
  }
}
