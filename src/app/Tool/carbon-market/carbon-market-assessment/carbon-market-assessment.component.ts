import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { FieldNames, MasterDataDto, MasterDataService, assessment_geoArea_tooltip, assessment_period_info, assessment_sector_tooltip, chapter6_url } from 'app/shared/master-data.service';
import * as moment from 'moment';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AllBarriersSelected, Assessment, AssessmentCMDetail, AssessmentCMDetailControllerServiceProxy, AssessmentControllerServiceProxy, BarrierSelected, CMDefaultValue, Category, Characteristics, ClimateAction, GeographicalAreasCovered, InvestorSector, InvestorToolControllerServiceProxy, MethodologyAssessmentControllerServiceProxy, PolicyBarriers, ProjectControllerServiceProxy, Sector, SectorControllerServiceProxy, ServiceProxy, ToolsMultiselectDto } from 'shared/service-proxies/service-proxies';
import decode from 'jwt-decode';
import { ActivatedRoute } from '@angular/router';
import { DialogService } from 'primeng/dynamicdialog';
import { GuidanceVideoComponent } from 'app/guidance-video/guidance-video.component';
import { MultiSelect } from 'primeng/multiselect';
import { AppService } from 'shared/AppService';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-carbon-market-assessment',
  templateUrl: './carbon-market-assessment.component.html',
  styleUrls: ['./carbon-market-assessment.component.css']
})
export class CarbonMarketAssessmentComponent implements OnInit {
  countryId: any;
  visible_ex_ante: any;

  @ViewChild('multiSelectComponent') multiSelectComponent: MultiSelect;
  geographicalArea:MasterDataDto = new MasterDataDto()
  policies: ClimateAction[]
  assessment: Assessment = new Assessment()
  cm_detail: AssessmentCMDetail = new AssessmentCMDetail()
  assessment_types: any[]
  assessment_approaches: any[]
  impact_types: any[] = []
  impact_categories: any[] = []
  impact_characteristics: any[] = []
  sectorial_boundires: any[] = []
  int_cm_approches: any[] = []

  selected_impact_types: string[] = []
  selected_impact_categories: string[] = []
  selected_impact_characteristics: string[] = []

  showSections: boolean = false
  isSavedAssessment: boolean = false

  date1: any
  date2: any

  assessmentres: Assessment
  levelOfImplementation: MasterDataDto[];
  sectorArray: Sector[]=[];
  geographicalAreasCoveredArr: MasterDataDto[];
  sectorList: any[] = [];
  international_tooltip:string;
  
  barrierBox: boolean = false;
  barrierSelected: BarrierSelected = new BarrierSelected();
  finalBarrierList: BarrierSelected[] = [];
  barrierArray: PolicyBarriers[];
  isDownloading: boolean = true;
  isDownloadMode: number = 0;
  sectorsJoined: string = '';
  finalSectors: Sector[] = []
  characteristicsList: Characteristics[] = [];
  isStageDisble:boolean=false;
  tableData : any;
  isEditMode: boolean 
  assessmentId: number
  scales: MasterDataDto[]
  tooltipContent: any;
  visionExample: any[] = []
  phaseTransformExapmle: any[] = []
  barrierChList: any[];
  minDate: Date;
  minDateTo: Date;
  fieldNames = FieldNames
  chapter6_url = chapter6_url
  geographicalAreasCovered: any[] = [];
  expected_ghg_mitigation: number
  from_date:Date
  to_date: Date
  assessment_period_info = assessment_period_info
  isCompleted: boolean = false;
  isContinue: boolean = false;
  isDisableIntervention: boolean = false;
  completModeSectorList: Sector[]=[];
  selectedSectorsCompleteMode: Sector[] = [];
  autoSaveDialog: boolean;

logOutSubs: Subscription;
  assessment_geoArea_tooltip = assessment_geoArea_tooltip
  assessment_sector_tooltip = assessment_sector_tooltip
  constructor(
    private projectControllerServiceProxy: ProjectControllerServiceProxy,
    private methodologyAssessmentControllerServiceProxy: MethodologyAssessmentControllerServiceProxy,
    public masterDataService: MasterDataService,
    private serviceProxy: ServiceProxy,
    private messageService: MessageService,
    private sectorProxy: SectorControllerServiceProxy,
    private investorToolControllerServiceProxy: InvestorToolControllerServiceProxy,
    private assessmentControllerServiceProxy: AssessmentControllerServiceProxy,
    private assessmentCMDetailControllerServiceProxy: AssessmentCMDetailControllerServiceProxy,
    private route: ActivatedRoute,
    protected dialogService: DialogService,
    private confirmationService: ConfirmationService,
    private appService: AppService
  ) { }

  async ngOnInit(): Promise<void> {
    // this.appService.autoSavingDone.next(true)
    this.tableData =  this.getProductsData();
    this.assessment_types = this.masterDataService.assessment_type
    this.impact_types = this.masterDataService.impact_types
    this.sectorial_boundires = this.masterDataService.sectorial_boundries
    this.assessment_approaches = this.masterDataService.assessment_approach
    this.int_cm_approches = this.masterDataService.int_cm_approaches
    this.levelOfImplementation = this.masterDataService.level_of_implemetation;
    this.scales = this.masterDataService.scale_of_activity;
    this.geographicalAreasCovered = this.masterDataService.level_of_implemetation;

    await this.getPolicies()
    await this.getSetors()
    this.route.queryParams.subscribe(async params => {
      this.assessmentId = params['id']
      this.isEditMode = params['isEdit']
      params['iscompleted'] == 'true' ? (this.isCompleted = true) : false
      params['isContinue'] == 'true' ? (this.isContinue = true) : false
      if(params['interventionId'] && params['assessmentType']){
        await this.getPolicies().then( x=>
          this.setDataFromFlow(params['interventionId'],params['assessmentType'])
        )
        
      }

    })
    await this.setInitialStates()
    this.phaseTransformExapmle = this.masterDataService.phase_transfrom
    this.visionExample = [
      { title: 'Transformational Vision', value: 'Decarbonized electricity sector with a high % of Solar PV energy which will enable economic growth and will lead the shift of the labour market towards green jobs.' },
      { title: 'Long term (> 15 years)', value: 'Zero-carbon electricity production. The 2050 vision is to achieve 60% solar PV in the national electricity mix and create 2 million new green jobs.' },
      { title: 'Medium term (> 5 years and  < 15 years)', value: 'Achieve 30% solar PV in the national electricity mix and create 1 million new green jobs. ' },
      { title: 'Short term (< 5 years)', value: 'Install 20 GW of rooftop solar PV and create 200,000 new green jobs in doing so. The solar PV policy is implemented at subnational levels, supported by incentives for private sector involvement and knowledge development.' },
      { title: 'Phase of transformation', value: 'Acceleration. Solar PV is widely accepted in the society and its use is spreading increasingly fast. Fossil-fuel based energy production is being challenged as the only way to ensure a reliable energy supply. Changes have already occurred in the economy, institutions and society as a result of the spreading of Solar PV.' },
      { title: 'Intervention contribution to change the system to achieve the vision', value: 'The intervention being assessed will facilitate the spreading of Solar PV installations and thus contribute to increase the penetration of solar PV in the national electricity mix.' },
    ]

    this.international_tooltip = 'Name of international or private carbon market standard under which the intervention is registered.'
    await this.getCharacteristics();

    if (!this.isEditMode) {
      this.logOutSubs = this.appService.loginOut.subscribe(res => {
        if (res) {
          this.appService.autoSavingDone.next(true)
        }
      })
    }
  }
  setDataFromFlow(interventonId:string, assessmentType:string) {
    this.isDisableIntervention = true
    this.assessment.climateAction = this.policies.find((i)=>i.id==Number(interventonId))! 
    this.assessment.assessmentType = assessmentType;
    let event:any = {}
    event.value = this.assessment.climateAction
    this.onSelectIntervention(event)
  }
  watchVideo(){
    let ref = this.dialogService.open(GuidanceVideoComponent, {
      header: 'Guidance Video',
      width: '60%',
      contentStyle: {"overflow": "auto"},
      baseZIndex: 10000,
      data: {
        sourceName: 'CMtool',
      },
    });

    ref.onClose.subscribe(() => {
      
    })
  }

  async setInitialStates() {
    if (this.isEditMode) {
      this.assessment = await this.assessmentControllerServiceProxy.findOne(this.assessmentId).toPromise()
      this.minDate = new Date(
        this.assessment.climateAction.dateOfImplementation.year(),
        this.assessment.climateAction.dateOfImplementation.month(),
        this.assessment.climateAction.dateOfImplementation.date(),
      )
      this.from_date= new Date(
        this.assessment.from?.year(),
        this.assessment.from?.month(),
        this.assessment.from?.date()
      );
      this.to_date= new Date(
        this.assessment.to?.year(),
        this.assessment.to?.month(),
        this.assessment.to?.date()
      );
      this.onSelectFromDate(this.from_date)
      this.finalBarrierList = this.assessment['policy_barrier'].map((i: { is_affected: boolean; characteristics: Characteristics[]; explanation: string; barrier: string; })=> {
        let p =  new BarrierSelected()
        p.affectedbyIntervention = i.is_affected
        p.characteristics = i.characteristics.map( char =>{
          let characteristic = new Characteristics()
          characteristic.id = char.id
          characteristic.name = char.name
          return characteristic
        })
        p.explanation = i.explanation
        p.barrier = i.barrier
        return p
        
       });
      let policy = this.policies.find(o => o.id === this.assessment.climateAction.id)
      if (policy) this.assessment.climateAction = policy
      this.cm_detail = await this.assessmentCMDetailControllerServiceProxy.getAssessmentCMDetailByAssessmentId(this.assessmentId).toPromise()
      this.expected_ghg_mitigation = this.cm_detail.expected_ghg_mitigation
      let areas: MasterDataDto[] = []
      this.cm_detail.geographicalAreasCovered.map(area => {
        let level = this.levelOfImplementation.find(o => o.code === area.code)
        if (level) {
          areas.push(level)
        }
      })
      this.geographicalAreasCoveredArr = areas;
      this.geographicalArea = this.geographicalAreasCoveredArr[0]
      

      this.completModeSectorList = this.assessment.climateAction.policySector.map(i=> i.sector)
      this.sectorList = this.completModeSectorList
      this.cm_detail.sectorsCovered.map(sector => {
        let _sector = this.sectorList.find(i =>i.id ==sector.sector.id)
        if(_sector){
          this.sectorArray.push(_sector)
        }
      })
    this.selectedSectorsCompleteMode =  this.sectorArray
      this.assessmentres = this.assessment
      this.showSections = true
      if (!this.isCompleted && this.isContinue) this.isSavedAssessment = true
    }
  }

  async getSetors() {
    const token = localStorage.getItem('ACCESS_TOKEN')!;
    const countryId = token ? decode<any>(token).countryId : 0;
    this.countryId = countryId;
    this.sectorList = await this.sectorProxy.findAllSector().toPromise()
  }

  async getPolicies() {
    this.policies = await this.projectControllerServiceProxy.findAllPolicies().toPromise()
  }
  async getCharacteristics() {
    this.characteristicsList = await this.methodologyAssessmentControllerServiceProxy.findAllCharacteristics().toPromise();
    this.barrierChList = [...this.characteristicsList]
    this.barrierChList = this.barrierChList.filter(ch => {return ch.category.type === 'process'})
  }

  save(form: NgForm) {
    this.assessment.tool = 'CARBON_MARKET'
    this.assessment.year = moment(new Date()).format("DD/MM/YYYY")
    this.assessment.assessment_approach = 'DIRECT'
    this.isStageDisble =true;
    if (!this.assessment.id) this.assessment.createdOn = moment(new Date())
    this.assessment.editedOn = moment(new Date())
    if(this.isCompleted || !this.isContinue){
      form.controls['sectors'].setValue(this.sectorArray)
    }

    if (form.valid) {
      this.autoSaveDialog = true
      this.assessment.from = moment(this.from_date)
      this.assessment.to = moment(this.to_date)
      this.methodologyAssessmentControllerServiceProxy.saveAssessment(this.assessment)
        .subscribe(res => {
          if (res) {
            this.cm_detail.cmassessment = res;

            
            if (this.finalBarrierList.length > 0) {
              let allBarriersSelected = new AllBarriersSelected()
                allBarriersSelected.allBarriers =this.finalBarrierList
                allBarriersSelected.climateAction =res.climateAction
                allBarriersSelected.assessment =res;

                this.projectControllerServiceProxy.policyBar(allBarriersSelected).subscribe((res) => {
                },
                (err) => {
                  this.messageService.add({
                    severity: 'error',
                    summary: 'Error.',
                    detail: 'Policy barriers saving failed',
                    sticky: true,
                  });
                })
            }

            let req = new AssessmentCMDetail()

            if (this.isEditMode && (this.isCompleted || !this.isContinue)) {
              let assessment = new Assessment()
              assessment.id = this.cm_detail.cmassessment.id
              assessment.init()
              req.id = this.cm_detail.id;
              req.cmassessment = assessment;
              req.scale = this.cm_detail.scale;
              req.boundraries = this.cm_detail.boundraries;
              req.intCMApproach = this.cm_detail.intCMApproach;
              req.appliedMethodology = this.cm_detail.appliedMethodology;
              delete (req as any).sectorsCovered;
              delete (req as any).geographicalAreasCovered;

            } else {
              req = this.cm_detail;
              delete (req as any).sectorsCovered;
              delete (req as any).geographicalAreasCovered;
            }

            this.serviceProxy.createOneBaseAssessmentCMDetailControllerAssessmentCMDetail(req)
              .subscribe(async _res => {
                if (_res) {
                  let toolsMultiselectDto = new ToolsMultiselectDto()
                  toolsMultiselectDto.sectors = []

                  for (let sector of this.sectorArray) {
                    let sec = new InvestorSector()
                    sec.assessment = res
                    sec.assessmentCMDetail = _res
                    sec.sector = sector
                    toolsMultiselectDto.sectors.push(sec)
                  }

                  this.geographicalAreasCoveredArr = []
                  let _a = new GeographicalAreasCovered()
                  _a.id = this.geographicalArea.id
                  _a.name = this.geographicalArea.name
                  _a.code = this.geographicalArea.code
                  _a.assessment= res
                  _a.assessmentCMDetail = _res
                  toolsMultiselectDto.geographicalAreas.push(_a)

                  if (this.isEditMode && (this.isCompleted || !this.isContinue)) {
                    toolsMultiselectDto.isCompleted = this.isCompleted ? this.isCompleted : !this.isContinue;
                    toolsMultiselectDto.assessmentId = res.id;
                  }

                  let res_sec = await this.investorToolControllerServiceProxy.saveToolsMultiSelect(toolsMultiselectDto).toPromise()
                  if (res_sec['sector'] && res_sec['area']) {
                    this.messageService.add({
                      severity: 'success',
                      summary: 'Success',
                      detail: 'Assessment has been created successfully',
                      closable: true,
                    })
                    if ((!this.isCompleted && this.isContinue ) || !this.isEditMode) this.isSavedAssessment = true
                    this.assessmentres = res
                    this.showSections = true
                  } else if (!res_sec['sector']) {
                    this.messageService.add({
                      severity: 'error',
                      summary: 'Error',
                      detail: 'Secotrs covered saving failed.',
                      closable: true,
                    })
                  } else if (!res_sec['area']){
                    this.messageService.add({
                      severity: 'error',
                      summary: 'Error',
                      detail: 'Geographical area covered saving failed.',
                      closable: true,
                    })
                  }
                }
              }, error => {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: 'Assessment detail saving failed',
                  closable: true,
                })
              })
          }
        }, error => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Assessment creation failed',
            closable: true,
          })
        })
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Fill all mandatory fields',
        closable: true,
      })
    }
  }

  saveDraft() {
    this.assessment.tool = 'CARBON_MARKET'
    this.assessment.assessment_approach = 'DIRECT'
    this.assessment.isDraft = true
    this.assessment.lastDraftLocation = 'initial'
    if (!this.assessment.id) this.assessment.createdOn = moment(new Date())
    this.assessment.editedOn = moment(new Date())
    if (this.from_date) this.assessment.from = moment(this.from_date)
    if (this.to_date) this.assessment.to = moment(this.to_date)

    this.methodologyAssessmentControllerServiceProxy.saveAssessment(this.assessment)
      .subscribe(res => {
        if (res) {
          this.assessment = res
          this.assessmentres = res
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Assessment saved as draft',
            closable: true,
          })
        }
      }, error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Draft save failed',
          closable: true,
        })
      })
  }

  onSelectIntervention(event: any) {
    this.minDate = new Date(event.value.dateOfImplementation)
    
    if (!this.isEditMode) {
      this.from_date = new Date(event.value.dateOfImplementation);
      this.onSelectFromDate(this.from_date);
    }

    this.geographicalArea = this.geographicalAreasCovered.find(item=>{
      if (item.name==this.assessment.climateAction.geographicalAreaCovered){
        return item
      }
    })
    this.sectorList = this.assessment.climateAction.policySector.map(i=> i.sector)
    this.sectorArray = this.sectorList
  }

  onChangeGeoAreaCovered(){
    if(this.assessment.climateAction.geographicalAreaCovered && this.geographicalArea.name !==this.assessment.climateAction.geographicalAreaCovered ){
      this.confirmationService.confirm({
        message: `You selected a geographical scope that deviates from the one that was assigned to this intervention- ${this.assessment.climateAction.geographicalAreaCovered }. Are you sure you want to continue with this selection?`,
        header: 'Confirmation',
        acceptIcon: 'icon-not-visible',
        rejectIcon: 'icon-not-visible',
        acceptLabel: 'Continue',
        rejectLabel: 'Go back',
        key: 'geoConfirm',
        accept: () => {
        },
        reject: () => { 
          if(this.isCompleted){
            this.geographicalArea = this.geographicalAreasCovered.find(item=>{
              if (item.name==this.assessment['geographicalAreasCovered'][0].name){
                return item
              }
            })
          }
          else{
            this.geographicalArea = this.geographicalAreasCovered.find(item=>{
              if (item.name==this.assessment.climateAction.geographicalAreaCovered){
                return item
              }
            })
          }
        },
      });
    }
  }

  onItemSelectSectors(event: any) {
    if(this.assessment.climateAction.policySector){
      if(this.assessment.climateAction.policySector.length !=  this.sectorArray.length ){
        this.closeMultiSelect();
        this.confirmationService.confirm({
          message: `You selected sectors that deviates from the one that was assigned to this intervention- ${ this.assessment.climateAction.policySector.map(i=> i.sector.name).join(",")}. Are you sure you want to continue with this selection?`,
          header: 'Confirmation',
          acceptIcon: 'icon-not-visible',
          rejectIcon: 'icon-not-visible',
          acceptLabel: 'Continue',
          rejectLabel: 'Go back',
          key: 'sectorConfirm',
          accept: () => {
          },
          reject: () => { 
            if(!this.isCompleted){
              this.sectorArray = this.sectorList
            }else{
             this.sectorArray = this.selectedSectorsCompleteMode
            }
          },
        });
      }
      
    }
    
  }
  closeMultiSelect() {
    if (this.multiSelectComponent) {
      this.multiSelectComponent.overlayVisible = false;
    }
  }

  selectAssessmentType(e: any) {
    if (e.value === 'Ex-ante') {
      this.visible_ex_ante = true
    }
  }

  selectAssessmentApproach(e: any) {

  }

  onSelectType(e: any) {
    this.impact_categories = []
    e.value.forEach((val: string) => {
      this.impact_categories.push(...this.masterDataService.impact_categories.filter(cat => cat.type === val))
    })
  }

  onSelectCategory(e: any) {
    this.impact_characteristics = []
    e.value.forEach((val: string) => {
      this.impact_characteristics.push(...this.masterDataService.impact_characteristics.filter(cat => cat.type.includes(val)))
    })

    this.impact_characteristics = this.impact_characteristics.filter((v, i, a) => a.findIndex(v2 => (v2.code === v.code)) === i)
  }

  okay() {
    this.visible_ex_ante = false
  }

  okayAutosave() {
    this.autoSaveDialog = false
  }

  pushBarriers(barrier:any){
    this.finalBarrierList.push(barrier)
    this.barrierSelected = new BarrierSelected()
  
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

  toDownload() {
    this.isDownloadMode = 1;
    
  }
  showDialog(){
    if (!this.isEditMode) this.barrierBox =true; 
    else if (this.isEditMode && (this.isCompleted || !this.isContinue)) this.barrierBox = true;
  }

  getProductsData() {
    return [
        {
            barrier: 'Lack of financial capacity',
            explanation: 'Some plant operators simply do not have the financial capacity to introduce the technology or to train staff adequately',
            cha: 'Scale up, Beneficiaries',
            ans: 'No',
        },
        {
          barrier: 'Lack of public awareness of environmental and private economy benefits of EE measures and conservation',
          explanation: 'Lack of awareness may also lead to reluctance to introduce low-carbon technologies, such as EV or HEV, which may disrupt conventional technologies',
          cha: 'Awareness, Behaviour',
          ans: 'Yes',
      },
      {
        barrier: 'Lack of institutional support',
        explanation: 'Insufficient support from municipal government authorities hinder the adoption and proper implementation of the initiative',
        cha: 'Institutional and regulatory',
        ans: 'No',
    },
    ]
  }


  onSelectFromDate(event: any) {
    this.minDateTo = new Date(event) 
  }

}
