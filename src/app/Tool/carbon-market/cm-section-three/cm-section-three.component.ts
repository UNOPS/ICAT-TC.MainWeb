import { HttpClient, HttpResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FieldNames, MasterDataService } from 'app/shared/master-data.service';
import { floorToHalf } from 'app/shared/score-rounding.util';
import { environment } from 'environments/environment';
import * as moment from 'moment';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { AppService } from 'shared/AppService';
import { Assessment, AssessmentCMDetailControllerServiceProxy, CMAssessmentQuestion, CMAssessmentQuestionControllerServiceProxy, CMDefaultValue, CMQuestion, CMQuestionControllerServiceProxy, CMResultDto, Category, Characteristics, Institution, InstitutionControllerServiceProxy, InvestorToolControllerServiceProxy, MethodologyAssessmentControllerServiceProxy, OutcomeCategory, PortfolioSdg, SaveCMResultDto, ScoreDto, UniqueCategory, UniqueCharacteristic } from 'shared/service-proxies/service-proxies';
import { openAuthenticatedUploadedFile } from 'app/shared/authenticated-download.util';


interface UploadEvent {
  originalEvent: HttpResponse<FileDocument>;
  files: File[];
}

interface FileDocument {
  fileName: string
}
@Component({
  selector: 'app-cm-section-three',
  templateUrl: './cm-section-three.component.html',
  styleUrls: ['./cm-section-three.component.css']
})
export class CmSectionThreeComponent implements OnInit {


  @Input() approach: string
  @Input() assessmentquestions: CMAssessmentQuestion[]
  @Input() isEditMode: boolean
  @Input() isCompleted: boolean
  @Input() assessment:Assessment;
  @Input() expected_ghg_mitigation: number
  @Output() onSubmit = new EventEmitter();

  @ViewChildren(NgForm) viewChildren!: QueryList<NgForm>;


  clickedFormMap: {[key: number]: boolean}= {}
  tabIsValid: {[key: number]: boolean}= {}
  tab1IsValid: {[key: number]: boolean}= {}
  maintabIsValid: {[key: number]: boolean}= {}

  comment: any;
  SDGs: SDG[]
  activeIndex: number = 0;
  processData: any;
  outcomeData: any;
  activeIndexMain: number = 0;
  mainTabIndex: any;
  categoryTabIndex: any;
  categories: any = {};
  types: any;
  selectedType: any;
  selectedCategory: any;
  questions: any = {};
  outcome: any = [];
  selectedSDGs: SDG[];
  results: CMResultDto[] = [];
  activeIndex2: number = 0;
  sdgsToLoop: SDG[];
  uploadedFiles: any = [];
  uploadUrl: string;
  GHG_scale_info: any;
  SD_scale_info: any;
  adaptation_scale_info: any;
  GHG_scale_score_macro: ScoreDto[];
  GHG_scale_score_medium: ScoreDto[];
  GHG_scale_score_micro: ScoreDto[];
  GHG_sustained_score: ScoreDto[];
  SDG_scale_score: ScoreDto[];
  SDG_sustained_score: ScoreDto[];
  adaptation_scale_score: ScoreDto[];
  adaptation_sustained_score: ScoreDto[];
  SDGScore: any = 0;
  adaptationScore: any = 0;
  SDGWeight: any = '10%';
  GHGScore: any;
  acceptedFiles: string = ".pdf, .jpg, .png, .doc, .docx, .xls, .xlsx, .csv";
  fileServerURL: string;
  institutions: Institution[] = [];
  relevance: any[];
  adaptation_tooltip: string;
  starting_situation_tooltip: string;
  expected_impact_tooltip: string;
  sdgList: any;
  selectedSDGsList: PortfolioSdg[] = [];
  categoriesToSave: string[] = [];
  isDraftSaved: boolean = false;
  nextClicked: boolean;
  savedData: boolean = false;
  relevance_tooltip: string;
  ghg_starting_situation_placeholder: any;
  isFirstLoading0: boolean = true;
  isFirstLoading1: boolean = true;
  fieldNames = FieldNames;
  notFilledCategories: (OutcomeCategory | UniqueCategory)[] = [];
  st_default: boolean = false
  ex_default: boolean = false
  default_values: {[key: string]: {st_default_values: CMDefaultValue[], ex_default_values: CMDefaultValue[]}} = {}
  useDefault: {[key: string]: {st_default: boolean, ex_default: boolean}} = {}
  useDefaultSDG: {[key: string]: {st_default: boolean, ex_default: boolean}} = {}
  source = 'IPCC, 2023: Summary for Policymakers. In: Climate Change 2023: Synthesis Report. Contribution of Working Groups I, II and III to the Sixth Assessment Report of the Intergovernmental Panel on Climate Change [Core Writing Team, H. Lee and J. Romero (eds.)]. IPCC, Geneva, Switzerland, pp. 1-34, doi: 10.59327/IPCC/AR6-9789291691647.001';

  sectoral_description = "Sectoral data should be used when possible. If sectoral data is unavailable, national data can be used. Data on national or sectoral level emissions can "+
  "be found in countries’ National Inventory Reports. If a National Inventory Report has not been submitted, National Communications or Biennial Transparency Reports (BTRs) may "+
  "also contain such information. At this level, the four applicable sectors would be Energy, IPPU, AFOLU and Waste, based on the 2006 IPCC Guidelines for National Greenhouse Gas "+
  "Inventories."
  sectoral_placeholder = 'Please enter justification, including source of data and scope of the assessment (i.e. sectoral or national level).\n\n'+
  'E.g.:In case of an intervention focusing on increasing the blend in cement production, the relevant sector is “Industrial Processes and Product Use”. And in case of an intervention focusing on increasing the share or renewables, the relevant sector is “Energy”.'
  subsectoral_description = "Subsectoral data should be used when possible. Subsectors can be identified using the categories listed in the 2006 IPCC Guidelines for National "+ 
  "Greenhouse Gas Inventories (e.g. 1A1. Fuel Combustion Activities – Energy Industries, 2B1. Chemical Industry – Ammonia Production). If subsectoral data is unavailable, "+
  "subnational data can be used. Please provide further information on the subnational reference emissions in the justification box below."
  subsectoral_placeholder = "Enter justification, including source of data and scope of the assessment (i.e. definition of the sub-sector or subnational boundary – for example, City of Jakarta).\n\n"+
  "E.g.:  “In case of an intervention focusing on increasing the blend in cement production, the relevant subsector is “Mineral industry "+
  "– cement production (2A1)”. And in case of an intervention focusing on increasing the share or renewables, the relevant sector is “Fuel combustion activities – energy industries "+
  "(1A1)”."
startingSituation: any;
logOutSubs: Subscription;
isLogoutClicked: boolean = false;


  constructor(
    private cMQuestionControllerServiceProxy: CMQuestionControllerServiceProxy,
    private methodologyAssessmentControllerServiceProxy: MethodologyAssessmentControllerServiceProxy,
    public masterDataService: MasterDataService,
    private messageService: MessageService,
    private institutionControllerServiceProxy: InstitutionControllerServiceProxy,
    private investorToolControllerServiceProxy: InvestorToolControllerServiceProxy,
    private cMAssessmentQuestionControllerServiceProxy: CMAssessmentQuestionControllerServiceProxy,
    private confirmationService: ConfirmationService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private appService: AppService,
    private assessmentCMDetailControllerServiceProxy: AssessmentCMDetailControllerServiceProxy,
    private http: HttpClient,
  ) {
    this.uploadUrl = environment.baseUrlAPI + "/document/upload-file-by-name" ; 
    this.fileServerURL = environment.baseUrlAPI+'/document/downloadDocumentsFromFileName/uploads';
  }

  async ngOnInit(): Promise<void> {
    this.types = [
      { name: 'Process of change', code: 'process' },
      { name: 'Outcome of change', code: 'outcome' }
    ]

    this.adaptation_tooltip = "Please describe the adaptation co-benefit resulting from the intervention and the approach for its determination.\n" +
      "An adaptation co-benefit is a measurable secondary outcome or impact of a climate change mitigation intervention that represents an increased resilience or reduced vulnerability to climate change impacts of a defined target system compared to a baseline scenario.\n" +
      "E.g.:\n" +
      "- maintained/increased crop production despite increase in floodings and/or droughts\n" +
      "- maintained/increased water availability despite a reduction in precipitation or increase in droughts\n" +
      "- Reduced/avoided loss of ecosystem services despite worsening climatic conditions";

    this.ghg_starting_situation_placeholder = {
      international: 'Please describe the baseline emissions on the international/global level.',
      national: 'Please describe the baseline emissions on the national or sectoral level',
      subNational: 'Please describe the baseline emissions on the subnational/regional/municipal or subsectoral level'
    }

    this.starting_situation_tooltip = "Please describe the baseline scenario on the indicated scale for the intervention, including the current and expected climate risks and impacts in the project area."
    this.expected_impact_tooltip = "Please describe the adaptation benefits on the indicated scale."
    this.relevance_tooltip = "Does the process characteristic affect/impact any of the identified barriers? Does the intervention affect or is affected by this process characteristic?"

    this.GHG_scale_info = this.masterDataService.GHG_scale_info;
    this.SD_scale_info = this.masterDataService.SD_scale_info;
    this.adaptation_scale_info = this.masterDataService.adaptation_scale_info;
    this.GHG_scale_score_macro = this.masterDataService.GHG_scale_score_macro;
    this.GHG_scale_score_medium = this.masterDataService.GHG_scale_score_medium;
    this.GHG_scale_score_micro = this.masterDataService.GHG_scale_score_micro;
    this.GHG_sustained_score = this.masterDataService.GHG_sustained_score;
    this.SDG_scale_score = this.masterDataService.SDG_scale_score;
    this.SDG_sustained_score = this.masterDataService.SDG_sustained_score;
    this.adaptation_scale_score = this.masterDataService.adaptation_scale_score;
    this.adaptation_sustained_score = this.masterDataService.adaptation_sustained_score;
    this.SDGs = this.masterDataService.SDGs;
    this.categories = await this.cMQuestionControllerServiceProxy.getUniqueCharacterisctics().toPromise();
    this.selectedType = this.types[0];
    this.selectedCategory = this.categories[this.selectedType.code][0];
    this.onCategoryTabChange({ index: 0 });
    this.isFirstLoading0 = false;
    this.outcome = await this.methodologyAssessmentControllerServiceProxy.getAllOutcomeCharacteristics().toPromise();
    this.outcome = this.outcome.sort((a: any, b: any) => a.order - b.order);
    this.institutionControllerServiceProxy.getAllInstitutions().subscribe((res: any) => {
      this.institutions = res;
    });
    if (this.isEditMode && this.isCompleted) {
      this.removeNullAssessmentQuestions();
    }
    this.relevance = this.masterDataService.relevance;
    await this.getSDGList();
    await this.setInitialState();
    this.initializeDefaultStatus();
    this.autoFillInternational();
    this.autoFillSDG();
  }

  removeNullAssessmentQuestions() {
    let AssessQ: CMAssessmentQuestion[] = []
    this.assessmentquestions.map(q => {
      if (['SOCIAL_NORMS', 'BEHAVIOUR', 'AWARENESS', 'INSTITUTIONAL_AND_REGULATORY', 'DISINCENTIVES', 'ECONOMIC_NON_ECONOMIC', 'BENIFICIARIES', 'COALITION_OF_ADVOCATES', 'ENTREPRENEURS', 'SCALE_UP', 'ADOPTION', 'R_&_D'].includes(q.characteristic.code)) {
        if (q.question.id !== undefined) {
          AssessQ.push(q)
        } else if (q.question.id === undefined && q.relevance === 0) {
          AssessQ.push(q)
        }
      } else {
        AssessQ.push(q)
      }
    })
    this.assessmentquestions = AssessQ;
  }

  subscribeLogout() {
    if (this.isEditMode && !this.isCompleted) {
      this.appService.autoSavingDone.next(false)

      this.logOutSubs = this.appService.loginOut.subscribe(res => {
        if (res) {
          this.appService.autoSavingDone.next(false)
          this.confirmationService.confirm({
            message: 'There might be unsaved changes. Do you want to continue logging out?',
            key: 'autosave',
            accept: () => {
              this.isLogoutClicked = true
              let draftCategory = ''
              let maincategory = this.types[this.activeIndexMain].code
              if (maincategory === 'process') {
                draftCategory = this.categories[maincategory][this.activeIndex].code
              } else {
                draftCategory = this.outcome[this.activeIndex2].type + '_' + this.outcome[this.activeIndex2].method
              }
              this.submit(draftCategory, true, draftCategory, maincategory === 'process' ? 'prose' : 'out')
            },
            reject: () => {
              this.appService.autoSavingDone.next(true)
            }
          })
        }
      })
    }
  }

  async setInitialState() {
    let int=0;

    this.categories['process'].forEach((d: any) => {
      if (d.code == this.assessment.processDraftLocation) {
        this.activeIndex = int;
      }
      int = int + 1;
    })
    if (this.assessment.lastDraftLocation == "out") {
      this.activeIndexMain = 1;
    }
    this.outcome.forEach((d: any) => {
      if (d.code == this.assessment.outcomeDraftLocation) {
        this.activeIndex2 = d.order-1;
      }
    })
    if (this.isEditMode) {
      let sdgs: PortfolioSdg[] = []
      this.assessmentquestions.forEach(o => {
        if (o.selectedSdg.id !== undefined) {
          sdgs.push(o.selectedSdg)
        }
      })
      this.selectedSDGsList = [...new Map(sdgs?.map(item =>[item['name'], item])).values()];
      this.onSelectSDG({})

      await Promise.all(
        this.types.map((type: any) => {
          if (type.code === 'process') {
            this.categories[type.code].map((cat: any) => {
              cat.characteristics.map((char: any) => {
                let assQ = this.assessmentquestions.find(o => o.characteristic.id === char.id && o.question.id !== null)
                if (assQ) {
                  let rel = this.relevance.find(o => o.value === assQ?.relevance)
                  char.relevance = rel?.value
                }
                return char
              })
            })
          } else {
            this.outcome.map((cat: any) => {
              cat.results.map((res: any, idx: number) => {
                let assQ = this.assessmentquestions.find(o => o.characteristic.id === res.characteristic.id)
                if (assQ) {
                  res.startingSituation = assQ.startingSituation
                  res.expectedImpact = assQ.expectedImpact
                  res.comment = assQ.comment
                  res.sdgIndicator = assQ.sdgIndicator
                  res.adaptationCoBenifit = assQ.adaptationCoBenifit
                  res.assessmentQuestionId = assQ.id
                  res.filePath = assQ.uploadedDocumentPath
                  let score = this.getSelectedScoreFromOptions(assQ.assessmentAnswers[0]?.selectedScore, res.characteristic)
                  if (score) {
                    res.selectedScore = score
                    this.onSelectScore({}, res, idx)
                  }
                }
              })
            })
          }
        })
      )
      if (this.selectedSDGs?.length > 0) {
        await Promise.all(
          this.selectedSDGs = this.selectedSDGs.map((sdl: any) => {
            sdl.scaleResult = sdl.scaleResult.map((sc: any) => {
              let assQ = this.assessmentquestions.find(o => (o.characteristic.id === sc.characteristic.id) && (o.selectedSdg.id === sc.selectedSdg.id) )
              if (assQ) {
                sc.sdgIndicator = assQ.sdgIndicator
                sc.startingSituation = assQ.startingSituation
                sc.expectedImpact = assQ.expectedImpact
                sc.comment = assQ.comment
                sc.assessmentQuestionId = assQ.id
                sc.filePath = assQ.uploadedDocumentPath
                sc.selectedSdg = assQ.selectedSdg
                if (assQ.assessmentAnswers[0]) {
                  let score = this.getSelectedScoreFromOptions(assQ.assessmentAnswers[0].selectedScore, sc.characteristic)
                  if (score) sc.selectedScore = score
                }
              }
              return sc
            })
            sdl.sustainResult = sdl.sustainResult.map((sc: any) => {
              let assQ = this.assessmentquestions.find(o => (o.characteristic.id === sc.characteristic.id) && (o.selectedSdg.id === sc.selectedSdg.id))
              if (assQ) {
                sc.comment = assQ.comment
                sc.assessmentQuestionId = assQ.id
                sc.filePath = assQ.uploadedDocumentPath
                sc.selectedSdg = assQ.selectedSdg
                if (assQ.assessmentAnswers[0]) {
                  let score = this.getSelectedScoreFromOptions(assQ.assessmentAnswers[0].selectedScore, sc.characteristic)
                  if (score) {
                    sc.selectedScore = score
                    this.onSelectScore({}, sc, 2)
                  }
                }
              }
              return sc
            })
            return sdl
          })
        )
      }
    }
  }

  initializeDefaultStatus() {
    this.outcome.map((_outcome: OutcomeCategory) => {
      if (this.outcome.type !== 'SD') {
        _outcome.results.map(res => {
          if (!this.useDefault[res.characteristic.id]) this.useDefault[res.characteristic.id] = {st_default: false, ex_default: false}
        })
      }
    })
  }

  getSelectedScoreFromOptions (selectedScore: string, characteristic: Characteristics) {
    let score
    if (characteristic.code === "INTERNATIONAL" && characteristic.category.code === "SCALE_GHG") {
      score = this.GHG_scale_score_macro.find (o => o.value.toString() === selectedScore)
    } else if (characteristic.code === "NATIONAL" && characteristic.category.code === "SCALE_GHG") {
      score = this.GHG_scale_score_medium.find(o => o.value.toString() === selectedScore)
    } else if (characteristic.code === "SUBNATIONAL" && characteristic.category.code === "SCALE_GHG") {
      score = this.GHG_scale_score_micro.find(o => o.value.toString() === selectedScore)
    } else if (characteristic.category.code === "SUSTAINED_GHG") {
      score = this.GHG_sustained_score.find(o => o.value.toString() === selectedScore)
    } else if (characteristic.category.code === "SCALE_SD") {
      score = this.SDG_scale_score.find(o => o.value.toString() === selectedScore)
    } else if (characteristic.category.code === "SUSTAINED_SD") {
      score = this.SDG_sustained_score.find(o => o.value.toString() === selectedScore)
    } else if (characteristic.category.code === "SCALE_ADAPTATION") {
      score = this.adaptation_scale_score.find(o => o.value.toString() === selectedScore)
    } else if (characteristic.category.code === "SUSTAINED_ADAPTATION") {
      score = this.adaptation_sustained_score.find(o => o.value.toString() === selectedScore)
    }
    return score
  }

  async getSDGList(){
    this.sdgList =  await this.investorToolControllerServiceProxy.findAllSDGs().toPromise()
  }

  onMainTabChange(event: any) {
    this.selectedType = this.types[event.index]
    this.mainTabIndex = event.index;

    for (let i = 0; i<2; i++) {
      if (i == 0) {
        if (!this.isFirstLoading0) {
          this.checkTab1Mandatory(4);
  
          this.maintabIsValid[i] = true
          for (let k of Object.keys(this.tab1IsValid)) {
            if (!this.tab1IsValid[parseInt(k)]){
              this.maintabIsValid[i] = false;
              break;
            }
          }
        }
      } else {
        if (!this.isFirstLoading1) {
          this.checkTab2Mandatory(6)
          this.maintabIsValid[i] = true
          for (let k of Object.keys(this.tabIsValid)) {
            if (!this.tabIsValid[parseInt(k)]){
              this.maintabIsValid[i] = false;
              break;
            }
          }
        } else {
          this.isFirstLoading1 = false;
        }
      }
    }

  }

  async onCategoryTabChange(event: any) {
    this.nextClicked = false;
    this.categoryTabIndex = event.index;
    this.checkTab1Mandatory(event.index);
  }

  checkTab1Mandatory(idx: number) {
    for (const [index, category] of this.categories['process'].entries()) {
      if (index < idx) {
        let validation = category.characteristics?.filter((o:any) => o.relevance !== undefined)?.length === category.characteristics?.length
        this.tab1IsValid[index] = validation
        if (!validation) {
          this.notFilledCategories.push(category)
        } else {
          this.notFilledCategories = this.notFilledCategories.filter(o => o.code !== category.code)
        }
      }
    }
  }

  onSelectSDG(event: any) {
    let scaleResults: CMResultDto[] = []
    let sustainResults: CMResultDto[] = []
    this.outcome.forEach((category: { type: string; results: any[]; method: string; }) => {
      if (category.type === 'SD') {
        category.results.forEach(ch => {
          let res = new CMResultDto()
          res.characteristic = ch.characteristic
          res.type = this.approach
          if (category.method === 'SCALE') scaleResults.push(res)
          if (category.method === 'SUSTAINED') sustainResults.push(res)
        })
      }
    })

    let deSelected = this.selectedSDGs?.filter(sd => !this.selectedSDGsList?.find(o => o.id === sd.id))

    if (deSelected && deSelected.length > 0) {
      for (let de of deSelected) {
        this.selectedSDGs.splice(this.selectedSDGs.findIndex(o => o.id === de.id))
      }
    }

    let newSdgs = this.selectedSDGsList.filter(sd => !this.selectedSDGs?.find(o => o.id === sd.id))

    if (newSdgs && newSdgs.length > 0) {
      let mappedSdgs = newSdgs.map(sdg => {
        if (!this.useDefaultSDG[sdg.id]) this.useDefaultSDG[sdg.id] = {st_default: false, ex_default: false}
        let pSdg = new PortfolioSdg()
        pSdg.id = sdg.id
        pSdg.name = sdg.name
        let res: CMResultDto[] = scaleResults.map((o: any) => {
          let _r = new CMResultDto()
          Object.keys(_r).forEach(e => {
            _r[e] = o[e]
          })
          _r.selectedSdg = pSdg
          _r.isSDG = true
          return _r
        })
        let res2: CMResultDto[] = sustainResults.map((o: any) => {
          let _r = new CMResultDto()
          Object.keys(_r).forEach(e => {
            _r[e] = o[e]
          })
          _r.selectedSdg = pSdg
          _r.isSDG = true
          return _r
        })
  
        let _sdg: SDG = {
          name: sdg.name,
          code: (sdg.name.replace(/ /g, '')).toUpperCase(),
          id: sdg.id,
          number: sdg.number,
          scaleResult: res,
          sustainResult: res2
        }
        return _sdg
      })
      if (this.selectedSDGs) this.selectedSDGs.push(...mappedSdgs)
      else this.selectedSDGs = mappedSdgs
      this.autoFillSDG();
    }
  }

  onCategoryTabChange2($event: any) {
    this.checkTab2Mandatory(this.activeIndex2)
  }

  checkTab2Mandatory(idx: number) {
    if (idx + 1 === this.outcome.length) {
      for (let i = 0; i <= idx; i++) {
        this.validate(i)
      }
    } else {
      for (let i = 0; i < idx; i++) {
        this.validate(i)
      }
    }
  }

  validate(i: number) {
    let form = this.viewChildren.filter((f, idx) => idx === i)
    if (this.outcome[i].type === 'SD' && this.outcome[i].method === 'SCALE' && this.selectedSDGsList.length === 0) {
      this.tabIsValid[i] = false
      this.notFilledCategories.push(this.outcome[i])
    } else {
      if (form) {
        let validation = form[0].form.valid
        this.tabIsValid[i] = validation
        if (validation) {
          this.notFilledCategories = this.notFilledCategories.filter(o => o.code !== this.outcome[i].code)
        } else {
          this.notFilledCategories.push(this.outcome[i])
        }
      }
    }
  }

  isFormValid() {
    let form: any = this.viewChildren.filter((f, idx) => idx === this.activeIndex2)
    return form[0].form.valid
  }


  next(category: string, characteristics?: any[]) {
    this.nextClicked = true
    if (this.activeIndexMain === 1) {
      this.clickedFormMap[this.activeIndex2] = true
      if (!this.isFormValid()) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Please fill all mandotory fields',
          closable: true,
        });
      }
    }
    if (!this.isDraftSaved) {
      this.categoriesToSave.push(category)
    } else this.isDraftSaved = !this.isDraftSaved
    if (characteristics?.filter(o => o.relevance !== undefined)?.length === characteristics?.length) {
      if (this.activeIndexMain === 1 && this.isFormValid()) {
        this.activeIndex2 = this.activeIndex2 + 1;
        this.onCategoryTabChange2(this.activeIndex2)
      }
      if (this.activeIndex === this.categories.process.length - 1 ) {
        this.activeIndexMain = 1;
      }
      if (this.activeIndex <= this.categories.process.length - 2 && this.activeIndex >= 0 && this.activeIndexMain === 0 ) {
        this.activeIndex = this.activeIndex + 1;
      }
      if (this.activeIndexMain === 0) {
        this.onCategoryTabChange({ index: this.activeIndex })
      } 
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill all mandotory fields',
        closable: true,
      });
    }
  }

  async autoFillInternational(){
    try {
      let geographicalAreasCovered = this.assessment['geographicalAreasCovered'][0]
      if (geographicalAreasCovered === undefined){
        geographicalAreasCovered = (await this.assessmentCMDetailControllerServiceProxy.getAssessmentCMDetailByAssessmentId(this.assessment.id).toPromise()).geographicalAreasCovered[0];
      }
      if (geographicalAreasCovered && ['NATIONAL', 'SUBNATIONAL'].includes(geographicalAreasCovered.code)) {
        for (let _outcome of this.outcome) {
          if (['SCALE_GHG','SUSTAINED_GHG', 'SCALE_ADAPTATION' ,  'SUSTAINED_ADAPTATION'].includes(_outcome.code)) {
            let category_code = _outcome.code
            let score_array = _outcome.code === 'SCALE_GHG' ? this.masterDataService.GHG_scale_score_macro : 
            (_outcome.code === 'SUSTAINED_GHG' ? this.masterDataService.GHG_sustained_score : 
            (_outcome.code === 'SCALE_ADAPTATION' ? this.masterDataService.adaptation_scale_score: this.masterDataService.adaptation_sustained_score) ) 
            this.outcome = this.outcome.map((category: OutcomeCategory) => {
              if (category.code === category_code) {
                category.results = category.results.map((result: CMResultDto) => {
                  if (result.characteristic.code === 'INTERNATIONAL') {
                    if (!result.selectedScore.code) {
                      let score = score_array.find(o => o.code === '-99')
                      if (score) result.selectedScore = score
                    }
                    if (!result.comment) result.comment = 'The geographical area covered by this assessment is ' + (geographicalAreasCovered.code === 'NATIONAL' ? 'national/sectoral': 'sub-national/sub-sectoral.')
                    if (!result.startingSituation) result.startingSituation = 'N/A'
                    if (!result.expectedImpact ) result.expectedImpact = 'N/A'
                    if (['SCALE_ADAPTATION', 'SUSTAINED_ADAPTATION'].includes(category_code)) {
                      if (!result.adaptationCoBenifit) result.adaptationCoBenifit = 'N/A'
                    }
      
                    this.autoSaveResult(category.code, true, category.code, 'out', result.characteristic.id, undefined, undefined)
                  }
                  return result;
                })
              }
              return category
            })
          }
        }
      }
    } catch (error) {
      console.error("Error occurred in auto fill international", error)
    }
  }

  async autoFillSDG() {
    try {
      let geographicalAreasCovered = this.assessment['geographicalAreasCovered'][0]
      if (geographicalAreasCovered === undefined){
        geographicalAreasCovered = (await this.assessmentCMDetailControllerServiceProxy.getAssessmentCMDetailByAssessmentId(this.assessment.id).toPromise()).geographicalAreasCovered[0];
      }
      if (geographicalAreasCovered && ['NATIONAL', 'SUBNATIONAL'].includes(geographicalAreasCovered.code)) {
        this.selectedSDGs = this.selectedSDGs.map(sdg => {
          sdg.scaleResult = sdg.scaleResult.map(result => {
            if (result.characteristic.code === 'INTERNATIONAL') {
              if (!result.selectedScore.code) {
                let score = this.masterDataService.SDG_scale_score.find(o => o.code === '-99')
                if (score) result.selectedScore = score
              }
              if (!result.comment) result.comment = 'The geographical area covered by this assessment is ' + (geographicalAreasCovered.code === 'NATIONAL' ? 'national/sectoral': 'sub-national/sub-sectoral.')
              if (!result.startingSituation) result.startingSituation = 'N/A'
              if (!result.expectedImpact) result.expectedImpact = 'N/A'
              if (!result.sdgIndicator) result.sdgIndicator = 'N/A'
  
              this.autoSaveResult('SCALE_SD', true, 'SCALE_SD', 'out', result.characteristic.id, undefined, sdg.id)
            }
            return result
          })
          sdg.sustainResult = sdg.sustainResult.map(result => {
            if (result.characteristic.code === 'INTERNATIONAL') {
              if (!result.selectedScore.code) {
                let score = this.masterDataService.SDG_sustained_score.find(o => o.code === '-99')
                if (score) result.selectedScore = score
              }
              if (!result.comment) result.comment = 'The geographical area covered by this assessment is ' + (geographicalAreasCovered.code === 'NATIONAL' ? 'national/sectoral': 'sub-national/sub-sectoral.')
              if (!result.startingSituation) result.startingSituation = 'N/A'
              if (!result.expectedImpact) result.expectedImpact = 'N/A'
              if (!result.sdgIndicator) result.sdgIndicator = 'N/A'
              this.autoSaveResult('SUSTAINED_SD', true, 'SUSTAINED_SD', 'out', result.characteristic.id, undefined, sdg.id)
            }
            return result
          })
          return sdg
        })
      }
    } catch (error) {
      console.error("Error occurred in auto fill SDG", error)
    }
  }

  onSelectScore(event: any, char: CMResultDto, index: number, sdg_id? : number) {
    if (['SUSTAINED_GHG', 'SCALE_GHG'].includes(char.characteristic.category.code)) {
      let score: number | null = null
      let valid_scores = 0;
      this.outcome.forEach((category: OutcomeCategory) => {
        if (['SUSTAINED_GHG', 'SCALE_GHG'].includes(category.code)) {
          if (category.results.every(result => result.selectedScore.value === -99)) {
            score = score !== null ? score : null
          } else {
            category.results.forEach((result) => {
              score = score === null ? 0 : score = score
              if (result.selectedScore.value) {
                score = score + (result.selectedScore.value === -99 ? 0 : result.selectedScore.value)
                valid_scores += result.selectedScore.value === -99 ? 0 : 1;
              }
            })
          }
        }
      })
      this.GHGScore = score === null ? 'N/A' : floorToHalf(score / valid_scores)
    } else if (['SUSTAINED_SD', 'SCALE_SD'].includes(char.characteristic.category.code)) {
      let score: number | null = null
      let valid_scores_sdg = 0
      this.selectedSDGs.forEach(sdg => {
        if (sdg.scaleResult.every(sr =>  sr.selectedScore.value === undefined ||  sr.selectedScore.value === -99)) {
          score = score !== null ? score : null
        } else {
          sdg.scaleResult.forEach(sr => {
            score = score === null ? 0 : score = score
            if (sr.selectedScore.value) {
              score = score + (sr.selectedScore.value === -99 ? 0 : sr.selectedScore.value)
              valid_scores_sdg += sr.selectedScore.value === -99 ? 0 : 1
            }
          })
        }
        if (sdg.sustainResult.every(sr => sr.selectedScore.value === undefined || sr.selectedScore.value === -99)) {
          score = score !== null ? score : null
        } else {
          sdg.sustainResult.forEach(susr => {
            score = score === null ? 0 : score = score
            if (susr.selectedScore.value) {
              score = score + (susr.selectedScore.value === -99 ? 0 : susr.selectedScore.value)
              valid_scores_sdg += susr.selectedScore.value === -99 ? 0 : 1
            }
          })
        }
      })
      this.SDGScore = score === null ? 'N/A' : floorToHalf(score / valid_scores_sdg)
      
    } else if (['SUSTAINED_ADAPTATION', 'SCALE_ADAPTATION'].includes(char.characteristic.category.code)) {
      let score: number | null = null
      let valid_scores_ad = 0 
      this.outcome.forEach((category: OutcomeCategory) => {
        if (['SUSTAINED_ADAPTATION', 'SCALE_ADAPTATION'].includes(category.code)) {
          if (category.results.every(sr => sr.selectedScore.value === -99 || sr.selectedScore.value === undefined)) {
            score = score !== null ? score : null
          } else {
            category.results.forEach((result) => {
              score = score === null ? 0 : score = score
              if (result.selectedScore.value) {
                score = score + (result.selectedScore.value === -99 ? 0 : result.selectedScore.value)
                valid_scores_ad += result.selectedScore.value === -99 ? 0 : 1
              }
            })
          }
        }
      })
      this.adaptationScore = score === null ? 'N/A' : floorToHalf(score / valid_scores_ad);
    }
  }


  onAnswer(event: any, question: any, category: UniqueCategory, characteristic?: Characteristics) {
    let q = new CMQuestion()
    q.id = question.id

    question.result.question = q
    question.result.type = this.approach

    if (event.type === 'COMMENT') {
      question.result.comment = event.comment
    } else if (event.type === 'FILE') {
      question.result.filePath = event.path
    }
    else {
      if (event.type === 'INDIRECT') {
        question.result.institution = event.answer
      } else {
        question.result.answer = event.answer
      }
    }

    if (characteristic && !event.isLoading) {
      this.autoSaveResult(category.code, true, category.code, 'prose', characteristic.id, question.id, undefined)
    }

  }

  checkSustainSDGIsFilled() {
    if (this.selectedSDGs?.length > 0) {
      for (let sd of this.selectedSDGs) {
        for (let res of sd.sustainResult) {
          if (!res.selectedScore.code) {
            return false
          }
        }
      }
      return true
    } else {
      return true
    }
  }

  async submit(draftCategory: string, isDraft: boolean = false, name: string, type: string) {
    let _type = this.types[this.activeIndexMain]

    if (name === 'SCALE_SD' && this.isCompleted && !this.checkSustainSDGIsFilled()) {
      this.confirmationService.confirm({
        message: 'Pls make sure to update "Time frame outcome is sustained section" to update the result.',
        header: 'Warning',
        acceptLabel: 'Okay',
        rejectLabel: 'Cancel',
        accept: () => {
          this.categoriesToSave.push(draftCategory)
          this.next(draftCategory)
        }, reject: () => {}
      })
    } else {
      this.nextClicked = true
      this.results = []
      this.categoriesToSave.push(draftCategory)
      let save_process: boolean = false
      let save_sd_sc: boolean = false
      let save_sd_sus: boolean = false
      let save_ghg_sc: boolean = false
      let save_ghg_sus: boolean = false
      let save_ad_sc: boolean = false
      let save_ad_sus: boolean = false
      for await (let category of this.categories['process']) {
        if (isDraft) {
          if (this.categoriesToSave.includes(category.code)) save_process = true
          else save_process = false
        } else save_process = true
        if (save_process) {
          for await (let char of category.characteristics) {
            for await (let q of char.questions) {
              let res = new CMResultDto()
              Object.keys(q.result).forEach(e => {
                res[e] = q.result[e]
              })
              let ch = new Characteristics()
              ch.id = q.characteristic.id
              res.characteristic = ch
              res.relevance = char.relevance
              if (res.institution?.id) {
                let inst = new Institution()
                inst.id = res.institution.id
                res.institution = inst
              }
              res.type = this.approach
              if (this.isEditMode){
                let assQ = this.assessmentquestions.filter(o => (o.characteristic.id === char.id) && (o.question.id === q.id || o.relevance === 0))
                if (assQ) {
                  let addedCharacteristics = this.results.filter(o => o.characteristic.id === res.characteristic.id)
                  let assessmentquestionIds = assQ.map(q => q.id)
                  if (addedCharacteristics.length > 0) {
                    assessmentquestionIds = assessmentquestionIds.filter(aqid => !(addedCharacteristics.filter(o => o.assessmentQuestionId === aqid)?.length > 0))
                  }
                  let sortedQuestion = assQ.find(o => o.id === assessmentquestionIds[0])
                  if (sortedQuestion) {
                    res.assessmentQuestionId = sortedQuestion.id
                    if (sortedQuestion.assessmentAnswers.length > 0) {
                      res.assessmentAnswerId = sortedQuestion.assessmentAnswers[0]?.id
                    }
                  }
                }
                if (res.relevance === 0) {
                  this.results.push(res)
                }
              }
              res.selectedSdg = new PortfolioSdg()
              if (res.question.id) {
                this.results.push(res)
              } else if (res.relevance === 0) {
                this.results.push(res)
              } 
            }
          }
        }
      }
  
      if (this.selectedSDGs?.length > 0) {
        if (isDraft) {
          if (this.categoriesToSave.includes('SD_SCALE')) save_sd_sc = true
          else save_sd_sc = false
          if (this.categoriesToSave.includes('SD_SUSTAINED')) save_sd_sus = true
          else save_sd_sus = false
        } else save_sd_sc = true, save_sd_sus = true
        for await (let sd of this.selectedSDGs) {
          if (save_sd_sc) {
            sd.scaleResult.forEach(res => {
              if (res.selectedScore) {
                if (res.institution?.id) {
                  let inst = new Institution()
                  inst.id = res.institution.id
                  res.institution = inst
                }
                let score = new ScoreDto()
                score.name = res.selectedScore.name
                score.code = res.selectedScore.code
                score.value = res.selectedScore.value
                res.selectedScore = score
                res.type = this.approach
                if (this.isEditMode){
                  let assQ = this.assessmentquestions.find(o => (o.characteristic.id === res.characteristic.id) && (o.selectedSdg.id === res.selectedSdg.id))
                  if (assQ) {
                    res.assessmentQuestionId = assQ.id
                    res.assessmentAnswerId = assQ.assessmentAnswers[0]?.id
                  }
                }
                if (res.selectedScore.name) {
                  this.results.push(res)
                }
              }
            })
          }
          if (save_sd_sus) {
            sd.sustainResult.forEach(res => {
              if (res.selectedScore) {
                if (res.institution?.id) {
                  let inst = new Institution()
                  inst.id = res.institution.id
                  res.institution = inst
                }
                let susScore = new ScoreDto()
                susScore.name = res.selectedScore.name
                susScore.code = res.selectedScore.code
                susScore.value = res.selectedScore.value
                res.selectedScore = susScore
                res.type = this.approach
                if (this.isEditMode){
                  let assQ = this.assessmentquestions.find(o => (o.characteristic.id === res.characteristic.id) && (o.selectedSdg.id === res.selectedSdg.id))
                  if (assQ) {
                    res.assessmentQuestionId = assQ.id
                    res.assessmentAnswerId = assQ.assessmentAnswers[0].id
                  }
                }
                if (res.selectedScore.name) {
                  this.results.push(res)
                }
              }
            })
          }
        }
      }
  
      if (this.outcome?.length > 0) {
        for await (let item of this.outcome) {
          if (isDraft) {
            if (item.type === 'GHG') {
              if (this.categoriesToSave.includes('GHG_SCALE') && item.method === 'SCALE') { save_ghg_sc = true }
              if (this.categoriesToSave.includes('GHG_SUSTAINED') && item.method === 'SUSTAINED') { save_ghg_sus = true }
            } else if (item.type === 'ADAPTATION') {
              if (this.categoriesToSave.includes('ADAPTATION_SCALE') && item.method === 'SCALE') { save_ad_sc = true }
              if (this.categoriesToSave.includes('ADAPTATION_SUSTAINED') && item.method === 'SUSTAINED') { save_ad_sus = true }
            }
          } else { save_ghg_sc = true; save_ghg_sus = true; save_ad_sc = true; save_ad_sus = true; }
          if (item.type === 'GHG') {
            if (save_ghg_sc || save_ghg_sus) {
              item.results.forEach((res: any) => {
                res.type = this.approach
                if (res.institution?.id) {
                  let inst = new Institution()
                  inst.id = res.institution.id
                  res.institution = inst
                }
                if (res.selectedScore) {
                  let score = new ScoreDto()
                  score.name = res.selectedScore.name
                  score.code = res.selectedScore.code
                  score.value = res.selectedScore.value
                  res.selectedScore = score
                  res.type = this.approach
                  res.selectedSdg = new PortfolioSdg()
                  if (this.isEditMode){
                    let assQ = this.assessmentquestions.find(o => (o.characteristic.id === res.characteristic.id) )
                    if (assQ) {
                      res.assessmentQuestionId = assQ.id
                      res.assessmentAnswerId = assQ.assessmentAnswers[0].id
                    }
                  }
                  res.isSDG = false
                  res.isAdaptation = false
                  res.isGHG = true
                  if (res.selectedScore.name) {
                    this.results.push(res)
                  }
                }
              })
            }
          }
          if (item.type === 'ADAPTATION') {
            if (save_ad_sc || save_ad_sus) {
              item.results.forEach((res: any) => {
                res.type = this.approach
                if (res.institution?.id) {
                  let inst = new Institution()
                  inst.id = res.institution.id
                  res.institution = inst
                }
                if (res.selectedScore) {
                  let score = new ScoreDto()
                  score.name = res.selectedScore.name
                  score.code = res.selectedScore.code
                  score.value = res.selectedScore.value
                  res.selectedScore = score
                  res.type = this.approach
                  res.selectedSdg = new PortfolioSdg()
                  if (this.isEditMode){
                    let assQ = this.assessmentquestions.find(o => (o.characteristic.id === res.characteristic.id) )
                    if (assQ) {
                      res.assessmentQuestionId = assQ.id
                      res.assessmentAnswerId = assQ.assessmentAnswers[0].id
                    }
                  }
                  res.isSDG = false
                  res.isAdaptation = true
                  res.isGHG = false
                  if (res.selectedScore.name) {
                    this.results.push(res)
                  }
                }
              })
            }
          }
          save_ghg_sc = false; save_ghg_sus = false; save_ad_sc = false; save_ad_sus = false;
        }
      }
  
      let isValid = true
      if (draftCategory === '') {
        isValid = await this.checkMandotary()
      }
  
      if (!isDraft) {
        if (this.activeIndexMain === 1) {
          this.clickedFormMap[this.activeIndex2] = true
        }
        isValid = this.isFormValid()
      }
  
  
      if (isValid) {
        this.categoriesToSave = []
        this.isDraftSaved = true
        if(!isDraft && !this.isCompleted) this.savedData = true
        this.onSubmit.emit({result: this.results, isDraft: isDraft,name:name,type:type, expected_ghg_mitigation: this.expected_ghg_mitigation, isLogoutClicked: this.isLogoutClicked})
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Please fill all mandotory fields',
          closable: true,
        });
      }
    }
  }

  async autoSaveResult(draftCategory: string, isDraft: boolean, name: string, type: string, characteristicId: number | undefined, questionId: number | undefined, sdgId: number | undefined) {
    if (!this.isCompleted) {
      await this.loadAssessmentQuestions().then(() => {
        if (type === 'prose') {
          let result:CMResultDto[] =  []
          let category_result: UniqueCategory;
          let characteristic_result: any
          let questionResult: any;
          if (questionId && characteristicId) {
            category_result = this.categories['process'].find((o: UniqueCategory) => o.code === draftCategory)
            characteristic_result = category_result.characteristics.find((o: UniqueCharacteristic) => o.id === characteristicId)
            questionResult = characteristic_result?.questions.find((q: CMQuestion) => q.id === questionId)
            let _result = new CMResultDto()
            if (questionResult) {
              Object.keys(questionResult.result).forEach(e => {
                _result[e] = questionResult[e]
              })
              let ch = new Characteristics()
              ch.id = questionResult.characteristic.id
              _result.characteristic = ch
              _result.relevance = characteristic_result?.relevance
              _result.answer = questionResult.result.answer
              _result.question = questionResult.result.question
              _result.comment = questionResult.result.comment
              _result.filePath = questionResult.result.filePath
            }
            if (this.isEditMode){
              let assQ = this.assessmentquestions.find(o => (o.characteristic.id === characteristic_result.id) && (o.question.id === questionResult?.id || o.relevance === 0))
              if (assQ === undefined) {
                assQ = this.assessmentquestions.find(o => (o.characteristic.id === characteristic_result.id) && o.relevance !== undefined)
              }
              
              if (assQ) {
                _result.assessmentQuestionId = assQ.id
                if (assQ.assessmentAnswers.length > 0) {
                  _result.assessmentAnswerId = assQ.assessmentAnswers[0]?.id
                }
              }
            }
            result.push(_result)
          } else if (characteristicId) {
            category_result = this.categories['process'].find((o: UniqueCategory) => o.code === draftCategory)
            characteristic_result = category_result.characteristics.find((o: UniqueCharacteristic) => o.id === characteristicId)
            let _result = new CMResultDto()
            let ch = new Characteristics()
            ch.id = characteristic_result.id
            _result.characteristic = ch
            _result.relevance = characteristic_result.relevance
            if (this.isEditMode) {
              let assQ = this.assessmentquestions.find(o => o.characteristic.id === characteristic_result.id)
              if (assQ) {
                _result.assessmentQuestionId = assQ.id
                _result.assessmentAnswerId = assQ.assessmentAnswers[0].id
              }
            }
            result.push(_result)
          }
          this.saveResultInAutoSave(result, isDraft, type, name)
    
        } else if (type === 'out') {
          let selectedSdg: SDG | undefined
          if (draftCategory === 'SCALE_SD' || draftCategory === 'SUSTAINED_SD') {
            selectedSdg = this.selectedSDGs.find(o => o.id === sdgId)
          }
          if (draftCategory === 'SCALE_SD') {
            if (characteristicId === undefined && questionId === undefined) {
              let ids = this.selectedSDGs.map(o => o.id.toString())
              this.cMAssessmentQuestionControllerServiceProxy.deleteRemovedSDGS(this.assessment.id, ids).toPromise()
              this.selectedSDGs.map(sd => {
                let results = []
                results.push(...sd.scaleResult)
                results.push(...sd.sustainResult)
                if (results.length > 0) {
                  this.saveResultInAutoSave(results, isDraft, type, name)
                }
              })
            } else {
              if (selectedSdg) {
                let result = selectedSdg.scaleResult.find(res => res.characteristic.id === characteristicId)
                if (result !== undefined) {
                  if (this.isEditMode) {
                    let assQ = this.assessmentquestions.find(o => o.characteristic.id === result?.characteristic.id && o.selectedSdg.id === selectedSdg?.id)
                    if (assQ) {
                      result.assessmentQuestionId = assQ.id
                      result.assessmentAnswerId = assQ.assessmentAnswers[0].id
                    }
                  }
                  this.saveResultInAutoSave([result], isDraft, type, name)
                }
              }
            }
          } else if (draftCategory === 'SUSTAINED_SD') {
            if (selectedSdg) {
              let result = selectedSdg.sustainResult.find(res => res.characteristic.id === characteristicId)
              if (result) {
                if (this.isEditMode) {
                  let assQ = this.assessmentquestions.find(o => o.characteristic.id === result?.characteristic.id && o.selectedSdg.id === selectedSdg?.id)
                  if (assQ) {
                    result.assessmentQuestionId = assQ.id
                    result.assessmentAnswerId = assQ.assessmentAnswers[0].id
                  }
                }
                this.saveResultInAutoSave([result], isDraft, type, name)
              }
            }
          } else {
            let results = this.outcome.find((o: OutcomeCategory) => o.code === draftCategory)
            if (draftCategory === "SCALE_ADAPTATION" || draftCategory === 'SUSTAINED_ADAPTATION') {
              results.results = results.results.map((res: CMResultDto) => {
                res.isAdaptation = true
                res.isGHG = false
                res.isSDG = false
                return res
              })
            }
            let characteristic_result = results.results.find((o: CMResultDto) => o.characteristic.id === characteristicId)
      
            if (this.isEditMode) {
              let assQ = this.assessmentquestions.find(o => o.characteristic.id === characteristic_result.characteristic.id)
              if (assQ) {
                characteristic_result.assessmentQuestionId = assQ.id
                characteristic_result.assessmentAnswerId = assQ.assessmentAnswers[0].id
              }
            }
      
            this.saveResultInAutoSave([characteristic_result], isDraft, type, name)
          }
    
        } else if (type === 'reduction') {
          let cmResult: SaveCMResultDto = new SaveCMResultDto();
          cmResult.result = []
          cmResult.assessment = this.assessment;
          cmResult.isDraft = isDraft;
          cmResult.type = 'out';
          cmResult.name = name;
          cmResult.expectedGHGMitigation = this.expected_ghg_mitigation
          this.cMAssessmentQuestionControllerServiceProxy.saveResult(cmResult).subscribe(res => {
            if (res) {
              if (!this.isEditMode) {
                this.router.navigate(['../carbon-market-tool-edit'], { queryParams: { id: this.assessment.id, isEdit: true, isContinue: true }, relativeTo: this.activatedRoute });
              }
            }
          })
        }
      })
    }

  }

  saveResultInAutoSave(results: CMResultDto[], isDraft: boolean, type: string, name: string) {
    let cmResult: SaveCMResultDto = new SaveCMResultDto();
    cmResult.result = results;
    this.assessment.editedOn = moment()
    cmResult.assessment = this.assessment;
    cmResult.isDraft = isDraft;
    cmResult.type = type;
    cmResult.name = name;
    this.cMAssessmentQuestionControllerServiceProxy.saveResult(cmResult).subscribe(res => {
      if (res) {
        if (!this.isEditMode) {
          this.router.navigate(['../carbon-market-tool-edit'], { queryParams: { id: this.assessment.id, isEdit: true, isContinue: true }, relativeTo: this.activatedRoute });
        }
      }
    })
  }

  

  async checkMandotary () {
    let isValid = true
    for await (let category of this.categories['process']) {
      for await (let char of category.characteristics) {
        if (char.relevance === undefined) {
          isValid = false
          break
        }
      } 
    }
    return isValid
  }
  

  onUpload(event: UploadEvent, res: CMResultDto) {
    if (event.originalEvent.body) {
      res.filePath = event.originalEvent.body.fileName
    }

    this.messageService.add({ severity: 'info', summary: 'File Uploaded', detail: '' });
  }

  checkRelevance(index: number, categories: any[]): boolean {
    if (index === 0) {
      return false
    } else {
      for (let i = 0; i < index + 1; i++) {
        if (categories[i].characteristics.filter((o: { relevance: undefined; }) => o.relevance !== undefined).length !== categories[i].characteristics.length) {
          return true
        }
      }
      return false
    }
  }

  onRelevanceChange(event: any, characteristic: any) {
  }

  getNotFilledCaution(): string {
    let str: string = 'Please fill '
    let sections: string[] = []
    for (let notFilled of this.notFilledCategories) {
      if (notFilled.name.includes('<br>')) {
        if (notFilled.method === "SUSTAINED") {
          sections.push(this.mapType(notFilled.type) + ' - ' + notFilled.name.replace('<br>', '')  )
        } else {
          sections.push(notFilled.name.replace('<br>', ' - '))
        }
      } else {
        sections.push(notFilled.name)
      }
    }
    sections = [... new Set(sections)]
    str = str + sections.join(', ') + ' sections before continue.'
    return str
  }

  mapType(type: string) {
    switch(type) {
      case 'GHG':
        return 'GHGs'
      case 'SD':
        return 'SDGs'
      case 'ADAPTATION':
        return 'Adaptation co-benifits'
      default:
        return type
    }
  }

  adaptationJustificationChange(){
    this.checkTab2Mandatory(this.outcome.length - 1)
  }

  async loadDefaults(ch_id: number, code: string) {
    let res = await this.cMAssessmentQuestionControllerServiceProxy.getCMDefaultValues(ch_id).toPromise()
    if (res) {
      if (code === 'STARTING_SITUATION') {
        if (!this.default_values[ch_id]) this.default_values[ch_id] = {st_default_values: [], ex_default_values: []}
        this.default_values[ch_id].st_default_values = res;
        this.default_values[ch_id].st_default_values = this.default_values[ch_id].st_default_values.map(val => {val['label'] = val.starting_situation_value + ' ' + val.source; return val})
      } else {
        this.default_values[ch_id].ex_default_values = res;
        this.default_values[ch_id].ex_default_values = this.default_values[ch_id].ex_default_values.map(val => {val['label'] = val.expected_impact_value + ' ' + val.source; return val})
      }
    }
  }

  async loadAssessmentQuestions() {
    this.assessmentquestions = await this.cMAssessmentQuestionControllerServiceProxy.getAssessmentQuestionsByAssessmentId(this.assessment.id).toPromise()
  }

  onSelectDefault(event: any, char: CMResultDto) {
    char.startingSituation = event.value.label
  }

  async downloadUploadedFile(fileName: string): Promise<void> {
    if (!fileName) {
      return;
    }

    try {
      await openAuthenticatedUploadedFile(this.http, environment.baseUrlAPI, fileName);
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to download file',
        closable: true,
      });
    }
  }
}


export interface OutcomeResult {
  GHG: {
    scale: { [key: string]: any };
  };
}

export interface SDG {
  name: string
  code: string
  number: number
  id: number
  scaleResult: CMResultDto[]
  sustainResult: CMResultDto[]
}
