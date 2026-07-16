import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { FieldNames, MasterDataDto, MasterDataService, assessment_geoArea_tooltip, assessment_period_info, assessment_sector_tooltip, chapter6_url } from 'app/shared/master-data.service';
import * as moment from 'moment';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AllBarriersSelected, Assessment, AssessmentControllerServiceProxy, BarrierSelected, Characteristics, ClimateAction, CreateInvestorToolDto, FinalInvestorAssessmentDto, GeographicalAreasCoveredDto, ImpactCovered, IndicatorDetails, InstitutionControllerServiceProxy, InvestorAssessment, InvestorTool, InvestorToolControllerServiceProxy, MethodologyAssessmentControllerServiceProxy, PolicyBarriers, PortfolioQuestionDetails, PortfolioQuestions, Sector, SectorControllerServiceProxy } from 'shared/service-proxies/service-proxies';
import decode from 'jwt-decode';
import { TabView } from 'primeng/tabview';
import { environment } from 'environments/environment';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { DialogService } from 'primeng/dynamicdialog';
import { GuidanceVideoComponent } from 'app/guidance-video/guidance-video.component';
import { ProjectControllerServiceProxy } from 'shared/service-proxies/service-proxies';
import { MultiSelect } from 'primeng/multiselect';
import { OutcomDataDto } from '../investor-tool/investor-tool.component';
import { AppService } from 'shared/AppService';
import { Subscription } from 'rxjs';
import { openAuthenticatedUploadedFile } from 'app/shared/authenticated-download.util';


interface CharacteristicWeight {
  [key: string]: number;
}

interface SelectedSDG {
  id: number;
  answer: string;
  name: string;
  number: number;
}
interface ChaCategoryWeightTotal {
  [key: string]: number;
}

interface ChaCategoryTotalEqualsTo1 {
  [key: string]: boolean;
}

@Component({
  selector: 'app-portfolio-track4',
  templateUrl: './portfolio-track4.component.html',
  styleUrls: ['./portfolio-track4.component.css']
})
export class PortfolioTrack4Component implements OnInit, OnDestroy {

  @ViewChild('multiSelectComponent') multiSelectComponent: MultiSelect;
  geographicalArea: MasterDataDto = new MasterDataDto()
  assessment: Assessment = new Assessment();
  investorAssessment: InvestorTool = new InvestorTool();
  sectorArray: Sector[] = [];
  impactArray: ImpactCovered[] = [];
  assessment_types: any[];
  sdg_answers: any[];
  policies: ClimateAction[] = [];
  isSavedAssessment: boolean = false;
  levelOfImplementation: any[] = [];
  geographicalAreasCovered: any[] = [];
  sectorsCovered: any[] = [];
  impactCovered: any[] = [];
  assessmentMethods: any[] = [];
  countryID: number;
  sectorList: any[] = [];
  createInvestorToolDto: CreateInvestorToolDto = new CreateInvestorToolDto();
  meth1Process: Characteristics[] = [];
  meth1Outcomes: Characteristics[] = [];
  characteristicsList: Characteristics[] = [];
  characteristicsArray: Characteristics[] = [];
  selectedIndex = 0;
  activeIndex = 0;
  activeIndexMain = 0;
  activeIndex2: number = 0;
  likelihood: any[] = [];
  outcomeScaleScore: any[] = [];
  outcomeSustainedScore: any[] = [];
  relevance: any[] = [];
  selectedApproach: any;
  fileServerURL: string;
  uploadUrl: string;
  acceptedFiles: string = ".pdf, .jpg, .png, .doc, .docx, .xls, .xlsx, .csv";
  portfolioQuestions: PortfolioQuestions[] = [];
  description = ''
  load: boolean = false
  yesNoAnswer: any[] = [{ id: 1, name: "Yes" }, { id: 2, name: "No" }, { id: 3, name: "Maybe" }];
  assessmentApproach = [
    { name: 'Direct' },
    { name: 'Indirect' },
  ];

  assessmentMethodList: any[] = [
    { name: 'Track 4' }
  ];

  filePath: any

  processData: {
    type: string,
    CategoryName: string,
    categoryCode: string,
    categoryID: number,
    isValidated: boolean | null
    data: InvestorAssessment[]
  }[] = [];

  outcomeData: OutcomDataDto[] = [];
  @ViewChild(TabView) tabView: TabView;

  tabName: string = '';
  mainAssessment: Assessment;
  track4Selectt: boolean = false

  isLikelihoodDisabled: boolean = false;
  isRelavanceDisabled: boolean = false;
  mainTabIndexArray: number[] = [];
  initialLikelihood: number = 0;
  initialRelevance: number = 0;
  failedLikelihoodArray: { category: string, tabIndex: number }[] = []
  failedRelevanceArray: { category: string, tabIndex: number }[] = []
  tabLoading: boolean = false;
  characteristicsLoaded: boolean = false;
  categoriesLoaded: boolean = false;
  geographicalAreasCoveredArr: any[] = []

  barrierBox: boolean = false;
  barrierSelected: BarrierSelected = new BarrierSelected();
  finalBarrierList: BarrierSelected[] = [];
  editingBarrierIndex: number = -1;
  barrierArray: PolicyBarriers[];
  isDownloading: boolean = true;
  isDownloadMode: number = 0;
  sectorsJoined: string = '';
  finalSectors: Sector[] = [];
  isStageDisble: boolean = false;
  isValidSCaleSD: boolean;
  isValidSustainedSD: boolean;
  draftLoading: boolean = false;
  visionExample: { title: string; value: string; }[];
  barrierChList: any;
  minDate: Date;
  ghg_info: any
  sdg_info: any
  adaptation_info: any
  ghg_score_info: any
  fieldNames = FieldNames
  minDateTo: Date;

  tabIsValid: { [key: number]: boolean } = {}
  tab1IsValid: { [key: number]: boolean } = {}
  maintabIsValid: { [key: number]: boolean } = {}
  isFirstLoading0: boolean = true;
  isFirstLoading1: boolean = true;
  notFilledCategories: any[] = []
  chapter6_url = chapter6_url
  from_date: Date
  to_date: Date
  isCompleted: boolean = false;
  assessment_period_info = assessment_period_info
  isContinue: boolean = false;
  isDisableIntervention: boolean = false;
  completModeSectorList: Sector[] = [];
  selectedSectorsCompleteMode: Sector[] = [];
  isCreatingAssessment: boolean = false
  lastUpdatedCategory: any
  autoSaveTimer: any;
  visibleDialogBox: boolean = false;
  isSavingDraft: boolean = false;
  mainTabIndex: any = 0
  categoryTabIndex: any
  savedInInterval: boolean;
  isLogoutClicked: boolean;
  logOutSubs: Subscription
  isFirst: boolean = false;
  assessment_geoArea_tooltip = assessment_geoArea_tooltip
  assessment_sector_tooltip = assessment_sector_tooltip
  countryId: any;

  constructor(
    private projectControllerServiceProxy: ProjectControllerServiceProxy,
    public masterDataService: MasterDataService,
    private messageService: MessageService,
    private methodologyAssessmentControllerServiceProxy: MethodologyAssessmentControllerServiceProxy,
    private sectorProxy: SectorControllerServiceProxy,
    private investorToolControllerproxy: InvestorToolControllerServiceProxy,
    private router: Router,
    private institutionProxy: InstitutionControllerServiceProxy,
    private activatedRoute: ActivatedRoute,
    public sanitizer: DomSanitizer,
    private assessmentControllerServiceProxy: AssessmentControllerServiceProxy,
    protected dialogService: DialogService,
    private confirmationService: ConfirmationService,
    private appService: AppService,
    private http: HttpClient,

  ) {
    this.uploadUrl = environment.baseUrlAPI + "/document/upload-file-by-name";
    this.fileServerURL = environment.baseUrlAPI + '/document/downloadDocumentsFromFileName/uploads';

  }

  instiTutionList: any = []
  userCountryId: number = 0;
  sdgList: any = []
  selectedSDGs: SelectedSDG[] = [];
  selectedSDGsWithAnswers: SelectedSDG[] = [];

  sdgDataSendArray: any = [];

  sdgDataSendArray3: any = [];

  sdgDataSendArray4: any = [];

  sdgDataSendArray2: any = []
  tableData: any;

  assessmentId: number;
  isEditMode: boolean = false;
  phaseTransformExapmle: any[] = []

  async ngOnInit(): Promise<void> {
    this.phaseTransformExapmle = this.masterDataService.phase_transfrom
    this.levelOfImplementation = this.masterDataService.level_of_implemetation;
    this.geographicalAreasCovered = this.masterDataService.level_of_implemetation;
    this.ghg_info = this.masterDataService.other_invest_ghg_info
    this.sdg_info = this.masterDataService.other_invest_sdg_info
    this.adaptation_info = this.masterDataService.other_invest_adaptation_info
    this.ghg_score_info = this.masterDataService.other_invest_ghg_score_info
    this.getSetors();
    this.activatedRoute.queryParams.subscribe(async params => {
      params['isEdit'] == 'true' ? (this.isEditMode = true) : false;
      params['iscompleted'] == 'true' ? (this.isCompleted = true) : false
      params['isContinue'] == 'true' ? (this.isContinue = true) : false
      params['isFirst'] == 'true' ? (this.isFirst = true) : (this.isFirst = false)
      if (params['interventionId'] && params['assessmentType']) {
        await this.getPolicies().then(x =>
          this.setDataFromFlow(params['interventionId'], params['assessmentType'])
        )

      }
      this.assessmentId = params['id']
      if (!this.assessmentId && this.isEditMode) {
        window.location.reload();
      }


    })
    await this.getCharacteristics();
    if (this.isEditMode == false) {
      await this.getPolicies();
      await this.getAllImpactsCovered();
    }
    else {
      try {

        await this.getSavedAssessment()
          .then(x => {
            if (!this.isCompleted) {
              this.startAutoSave()
            }
          })
      }
      catch (error) {
      }
      this.autoFillInternational();
    }
    this.visionExample = [
      { title: 'Transformational Vision', value: 'Decarbonized electricity sector with a high % of Solar PV energy which will enable economic growth and will lead the shift of the labour market towards green jobs.' },
      { title: 'Long term (> 15 years)', value: 'Zero-carbon electricity production. The 2050 vision is to achieve 60% solar PV in the national electricity mix and create 2 million new green jobs.' },
      { title: 'Medium term (> 5 years and  < 15 years)', value: 'Achieve 30% solar PV in the national electricity mix and create 1 million new green jobs. ' },
      { title: 'Short term (< 5 years)', value: 'Install 20 GW of rooftop solar PV and create 200,000 new green jobs in doing so. The solar PV policy is implemented at subnational levels, supported by incentives for private sector involvement and knowledge development.' },
      { title: 'Phase of transformation', value: 'Acceleration. Solar PV is widely accepted in the society and its use is spreading increasingly fast. Fossil-fuel based energy production is being challenged as the only way to ensure a reliable energy supply. Changes have already occurred in the economy, institutions and society as a result of the spreading of Solar PV.' },
      { title: 'Intervention contribution to change the system to achieve the vision', value: 'The intervention being assessed will facilitate the spreading of Solar PV installations and thus contribute to increase the penetration of solar PV in the national electricity mix.' },
    ]

    this.tableData = this.getProductsData();

    this.selectedApproach = 'Direct';
    this.assessment.assessment_approach = 'Direct';

    await this.getPortfolioQuestions();
    const token = localStorage.getItem('ACCESS_TOKEN')!;
    const tokenPayload = decode<any>(token);
    this.userCountryId = tokenPayload.countryId;

    this.isLikelihoodDisabled = true;
    this.isRelavanceDisabled = true;

    let intTypeFilter: string[] = new Array();

    intTypeFilter.push('type.id||$eq||' + 3);

    this.institutionProxy.getInstitution(3, this.userCountryId, 1000, 0).subscribe((res: any) => {
      this.instiTutionList = res;
    });

    this.categoryTabIndex = 0;

    this.track4Selectt = true
    this.assessment.assessment_method = 'Track 4'

    this.assessment_types = this.masterDataService.assessment_type;
    this.sdg_answers = this.masterDataService.sdg_answers;
    this.levelOfImplementation = this.masterDataService.level_of_implemetation;
    this.geographicalAreasCovered = this.masterDataService.level_of_implemetation;
    this.likelihood = this.masterDataService.likelihood;
    this.outcomeScaleScore = this.masterDataService.outcomeScaleScore;
    this.outcomeSustainedScore = this.masterDataService.outcomeSustainedScore;
    this.relevance = this.masterDataService.relevance;

    this.assessmentMethods = this.masterDataService.assessment_method;

    const countryId = token ? decode<any>(token).countryId : 0;
    this.countryID = countryId;

    this.investorToolControllerproxy.findAllSDGs().subscribe((res: any) => {
      this.sdgList = res
    });
    this.isFirstLoading0 = false
    if (this.activeIndexMain === 0) {
      this.lastUpdatedCategory = this.processData[this.activeIndex]
    } else {
      this.lastUpdatedCategory = this.outcomeData[this.activeIndex2]
    }


  }

  async getSetors() {
    const token = localStorage.getItem('ACCESS_TOKEN')!;
    const countryId = token ? decode<any>(token).countryId : 0;
    this.countryId = countryId;
    this.sectorList = await this.sectorProxy.findAllSector().toPromise()
  }

  subscribeLogout() {
    if ((this.isEditMode || this.isSavedAssessment) && !this.isCompleted) {
      this.appService.autoSavingDone.next(false)

      this.logOutSubs = this.appService.loginOut.subscribe(res => {
        if (res) {
          this.confirmationService.confirm({
            message: 'There might be unsaved changes. Do you want to continue logging out?',
            key: 'autosave',
            accept: () => {
              this.isLogoutClicked = true
              if (this.isSavedAssessment) {
                this.saveDraft(this.lastUpdatedCategory, this.lastUpdatedCategory.CategoryName, this.lastUpdatedCategory.type === 'process' ? 'pro' : 'out', false, false)
              } else {
                this.appService.autoSavingDone.next(true)
              }
            },
            reject: () => {
            }
          })
        }
      })
    }
  }


  ngOnDestroy(): void {
    if (!this.isCompleted && (this.isSavedAssessment || this.isContinue || this.isEditMode) && !this.isFirst) {
      if (this.activeIndexMain === 0) {
        this.lastUpdatedCategory = this.processData[this.activeIndex]
      } else {
        this.lastUpdatedCategory = this.outcomeData[this.activeIndex2]
      }
      if (this.isEditMode) {
        if (!this.isSavingDraft) { this.saveDraft(this.lastUpdatedCategory, this.lastUpdatedCategory.CategoryName, this.lastUpdatedCategory.type === 'process' ? 'pro' : 'out', true, true) }
      } else {
        if (!this.savedInInterval) {
          if (!this.isSavingDraft) { this.saveDraft(this.lastUpdatedCategory, this.lastUpdatedCategory.CategoryName, this.lastUpdatedCategory.type === 'process' ? 'pro' : 'out', true, true) }
        }
      }
    } else {
      this.isFirst = false
    }
    this.stopAutoSave()
  }

  startAutoSave() {
    this.autoSaveTimer = setInterval(() => {
      if (this.activeIndexMain === 0) {
        this.lastUpdatedCategory = this.processData[this.activeIndex]
      } else {
        this.lastUpdatedCategory = this.outcomeData[this.activeIndex2]
      }
      this.savedInInterval = true
      if (!this.isSavingDraft) { this.saveDraft(this.lastUpdatedCategory, this.lastUpdatedCategory.CategoryName, this.lastUpdatedCategory.type === 'process' ? 'pro' : 'out', false, true) }
    }, 50000);
  }

  stopAutoSave() {
    clearInterval(this.autoSaveTimer);
  }

  setDataFromFlow(interventonId: string, assessmentType: string) {
    this.isDisableIntervention = true
    this.assessment.climateAction = this.policies.find((i) => i.id == Number(interventonId))!
    this.assessment.assessmentType = assessmentType;
    let event: any = {}
    event.value = this.assessment.climateAction
    this.onSelectIntervention(event)
  }

  watchVideo() {
    let ref = this.dialogService.open(GuidanceVideoComponent, {
      header: 'Guidance Video',
      width: '60%',
      contentStyle: { "overflow": "auto" },
      baseZIndex: 10000,
      data: {
        sourceName: 'General',
      },
    });

    ref.onClose.subscribe(() => {

    })
  }

  async getSavedAssessment() {
    this.processData = []
    this.outcomeData = []
    this.sdgDataSendArray = []
    this.sdgDataSendArray4 = []
    this.selectedSDGs = []
    this.selectedSDGsWithAnswers = [];
    this.assessment = await this.assessmentControllerServiceProxy.findOne(this.assessmentId).toPromise();
    this.processData = await this.investorToolControllerproxy.getProcessData(this.assessmentId).toPromise();
    this.outcomeData = await this.investorToolControllerproxy.getOutcomeData(this.assessmentId).toPromise();
    this.sdgDataSendArray2 = await this.investorToolControllerproxy.getScaleSDGData(this.assessmentId).toPromise();
    this.sdgDataSendArray4 = await this.investorToolControllerproxy.getSustainedSDGData(this.assessmentId).toPromise();
    this.selectedSDGs = await this.investorToolControllerproxy.getSelectedSDGs(this.assessmentId).toPromise();
    this.selectedSDGsWithAnswers = await this.investorToolControllerproxy.getSelectedSDGsWithAnswers(this.assessmentId).toPromise();
    this.minDate = new Date(
      this.assessment.climateAction.dateOfImplementation.year(),
      this.assessment.climateAction.dateOfImplementation.month(),
      this.assessment.climateAction.dateOfImplementation.date(),
    )
    this.from_date = new Date(
      this.assessment.from?.year(),
      this.assessment.from?.month(),
      this.assessment.from?.date()
    );
    this.to_date = new Date(
      this.assessment.to?.year(),
      this.assessment.to?.month(),
      this.assessment.to?.date()
    );
    this.onSelectFromDate(this.from_date)
    this.processData.forEach((d) => {
      if (d.CategoryName == this.assessment.processDraftLocation) {
        this.activeIndex = d.categoryID - 1;
      }
    })
    this.outcomeData.forEach((d) => {
      if (d.CategoryName == this.assessment.outcomeDraftLocation) {
        this.activeIndex2 = d.id;
      }
    })
    if (this.assessment.lastDraftLocation == 'out') {
      this.activeIndexMain = 1;
    }
    this.assessment = await this.assessmentControllerServiceProxy.findOne(this.assessmentId).toPromise();
    this.policies.push(this.assessment.climateAction)
    this.finalBarrierList = this.assessment['policy_barrier'].map((i: { is_affected: boolean; characteristics: Characteristics[]; explanation: string; barrier: string; }) => {
      let p = new BarrierSelected()
      p.affectedbyIntervention = i.is_affected
      p.characteristics = i.characteristics.map(char => {
        let characteristic = new Characteristics()
        characteristic.id = char.id
        characteristic.name = char.name
        return characteristic
      })
      p.explanation = i.explanation
      p.barrier = i.barrier
      return p

    });
    let areas: MasterDataDto[] = []
    this.assessment['geographicalAreasCovered'].map((area: { code: any; }) => {
      let level = this.levelOfImplementation.find(o => o.code === area.code)
      if (level) {
        areas.push(level)
      }
    })
    this.geographicalAreasCoveredArr = areas
    this.geographicalArea = this.geographicalAreasCoveredArr[0]
    this.completModeSectorList = this.assessment.climateAction.policySector.map(i => i.sector)
    this.sectorList = this.completModeSectorList
    this.assessment['sector'].map((sector: Sector) => {
      let _sector = this.sectorList.find(i => i.id == sector.id)
      if (_sector) {
        this.sectorArray.push(_sector)
      }
    })
    this.selectedSectorsCompleteMode = this.sectorArray
    this.processData = await this.investorToolControllerproxy.getProcessData(this.assessmentId).toPromise();
    this.setFrom()
    this.setTo()
    this.draftLoading = true
  }
  setFrom() {
    if (this.assessment.from) {
      let convertTime = moment(this.assessment.from).format("DD/MM/YYYY HH:mm:ss");
      let convertTimeObject = new Date(convertTime);
      this.assessment.from = moment(convertTimeObject);
    }

  }

  setTo() {
    if (this.assessment.to) {
      let convertTime = moment(this.assessment.to).format("DD/MM/YYYY HH:mm:ss");
      let convertTimeObject = new Date(convertTime);
      this.assessment.to = moment(convertTimeObject);
    }
  }

  assignSDG(sdg: any, data: any) {

    data.portfolioSdg = sdg;
  }


  onItemSelectSDGs(event: any) {
    const selectedIndexes = this.selectedSDGs.map(sdg => sdg.id);
    this.sdgDataSendArray2 = this.sdgDataSendArray2.filter((sdgData: { index: number; }) => selectedIndexes.includes(sdgData.index));

    this.sdgDataSendArray4 = this.sdgDataSendArray4.filter((sdgData: { index: number; }) => selectedIndexes.includes(sdgData.index));

    this.selectedSDGs.forEach(selectedSdg => {
      if (!this.sdgDataSendArray2.some((sdgData: { index: number; }) => sdgData.index === selectedSdg.id)) {
        const sdgData = JSON.parse(JSON.stringify(this.sdgDataSendArray[0]));
        const newObj = {
          CategoryName: sdgData.CategoryName,
          categoryID: sdgData.categoryID,
          type: sdgData.type,
          data: sdgData.data,
          index: selectedSdg.id
        };
        this.sdgDataSendArray2.push(newObj);
      }
    });

    this.selectedSDGs.forEach(selectedSdg => {
      if (!this.sdgDataSendArray4.some((sdgData: { index: number; }) => sdgData.index === selectedSdg.id)) {
        const sdgData = JSON.parse(JSON.stringify(this.sdgDataSendArray3[0]));
        const newObj = {
          CategoryName: sdgData.CategoryName,
          categoryID: sdgData.categoryID,
          type: sdgData.type,
          data: sdgData.data,
          index: selectedSdg.id
        };
        this.sdgDataSendArray4.push(newObj);
      }
    });


    this.selectedSDGsWithAnswers = this.selectedSDGs.map(selectedSdg => {
      const existingAnswer = this.selectedSDGsWithAnswers.find(
        sdgWithAnswer => sdgWithAnswer.id === selectedSdg.id
      );

      if (existingAnswer) {
        return { ...selectedSdg, answer: existingAnswer.answer };
      } else {
        return { ...selectedSdg, answer: "" };
      }
    });
    this.autoFillInternational();
  }

  async getPolicies() {
    this.policies = await this.projectControllerServiceProxy.findAllPolicies().toPromise();
  }
  async getAllImpactsCovered() {
    this.impactCovered = await this.investorToolControllerproxy.findAllImpactCovered().toPromise()
  }

  async getPortfolioQuestions() {
    this.investorToolControllerproxy.findAllPortfolioquestions().subscribe((res3: any) => {
      this.portfolioQuestions = res3;
    });
  }

  async getCharacteristics() {
    this.characteristicsList = await this.methodologyAssessmentControllerServiceProxy.findAllCharacteristics().toPromise();
    this.barrierChList = [...this.characteristicsList];
    this.barrierChList = this.barrierChList.filter((ch: Characteristics) => { return ch.category.type === 'process' });
    this.characteristicsLoaded = true;
    this.methodologyAssessmentControllerServiceProxy.findAllCategories().toPromise().then((res2: any) => {
      const customOrder = [1, 2, 3, 4, 5, 7, 6, 8, 9, 10];

      const sortedRes2 = res2.sort((a: any, b: any) => {
        const indexA = customOrder.indexOf(a.id);
        const indexB = customOrder.indexOf(b.id);
        return indexA - indexB;
      });


      for (let x of res2) {
        let categoryArray: InvestorAssessment[] = [];
        for (let z of this.characteristicsList) {

          if (z.category.name === x.name) {
            let newCharData = new InvestorAssessment();
            newCharData.characteristics = z;

            for (let q of this.portfolioQuestions) {
              if (newCharData.characteristics.id === q.characteristics.id) {
                let portfolioQuestionDetails = new PortfolioQuestionDetails()
                portfolioQuestionDetails.type = 'question';
                portfolioQuestionDetails.question = q
                newCharData.portfolioQuestion_details.push(portfolioQuestionDetails)

              }
            }


            categoryArray.push(newCharData);

          }
        }

        if (x.type === 'process') {
          this.processData.push({
            type: 'process', CategoryName: x.name, categoryID: x.id, categoryCode: x.code,
            data: categoryArray,
            isValidated: null
          })




        }
        if (x.type === 'outcome') {
          this.meth1Outcomes.push(x);

          this.outcomeData.push({
            type: 'outcome', CategoryName: x.name, categoryID: x.id,
            categoryCode: x.code,
            data: categoryArray,
            isValidated: null,
            id: 0
          })

          if (x.name === 'SDG Scale of the Outcome') {
            this.sdgDataSendArray.push({
              type: 'outcome', CategoryName: x.name, categoryID: x.id,
              categoryCode: x.code,
              data: categoryArray
            })
          }

          if (x.name === 'SDG Time frame over which the outcome is sustained') {
            this.sdgDataSendArray3.push({
              type: 'outcome', CategoryName: x.name, categoryID: x.id,
              categoryCode: x.code,
              data: categoryArray
            })
          }

        }
      }
      this.categoriesLoaded = true;

      if (this.characteristicsLoaded && this.categoriesLoaded) {
        this.tabLoading = true;
      }
    });
    if (this.activeIndexMain === 0) {
      this.lastUpdatedCategory = this.processData[this.activeIndex]
    } else {
      this.lastUpdatedCategory = this.outcomeData[this.activeIndex2]
    }

  }


  save(form: NgForm) {
    this.isStageDisble = true;

    this.assessment.tool = 'PORTFOLIO'
    this.assessment.year = moment(new Date()).format("DD/MM/YYYY")
    if (!this.assessment.id) this.assessment.createdOn = moment(new Date())
    this.assessment.editedOn = moment(new Date())
    if (this.isCompleted || !this.isContinue) {
      form.controls['sectors'].setValue(this.sectorArray)
    }
    if (form.valid) {

      this.assessment.from = moment(this.from_date)
      this.assessment.to = moment(this.to_date)
      this.methodologyAssessmentControllerServiceProxy.saveAssessment(this.assessment)
        .subscribe(res => {
          this.load = true
          if (res) {

            let allBarriersSelected = new AllBarriersSelected()
            allBarriersSelected.allBarriers = this.finalBarrierList
            allBarriersSelected.climateAction = res.climateAction
            allBarriersSelected.assessment = res;

            this.projectControllerServiceProxy.policyBar(allBarriersSelected).subscribe((res) => {
              let status = this.isCompleted ? 'updated' : 'created'
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: `Assessment has been ${status} successfully`,
                closable: true,
              },

              );
              if (!this.isCompleted) {
                setTimeout(() => {
                  this.visibleDialogBox = true;
                }, 300);
                setTimeout(() => {
                  this.visibleDialogBox = false;
                }, 6000);
              }
              this.startAutoSave()
            },
              (err) => {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error.',
                  detail: 'Internal server error in policy barriers',
                  sticky: true,
                });
              })
            this.geographicalAreasCoveredArr = []
            let _a = new GeographicalAreasCoveredDto()
            _a.id = this.geographicalArea.id
            _a.name = this.geographicalArea.name
            _a.code = this.geographicalArea.code
            this.geographicalAreasCoveredArr.push(_a)
            this.investorAssessment.assessment = res;
            this.mainAssessment = res
            this.createInvestorToolDto.sectors = this.sectorArray;
            this.createInvestorToolDto.impacts = this.impactArray;
            this.createInvestorToolDto.investortool = this.investorAssessment;
            this.createInvestorToolDto.geographicalAreas = this.geographicalAreasCoveredArr

            this.investorToolControllerproxy.createinvestorToolAssessment(this.createInvestorToolDto)
              .subscribe(_res => {
                if (_res) {
                  if (!this.isCompleted) {
                    this.isSavedAssessment = true;
                    this.autoFillInternational();
                    this.isCompleted ? this.isCreatingAssessment = false : this.isCreatingAssessment = true;
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
  pushBarriers(barrier: any) {
    if (this.editingBarrierIndex > -1) {
      this.finalBarrierList[this.editingBarrierIndex] = barrier
      this.editingBarrierIndex = -1
    } else {
      this.finalBarrierList.push(barrier)
    }
    this.barrierSelected = new BarrierSelected()
  }

  editBarrier(index: number) {
    const existing = this.finalBarrierList[index]
    const copy = new BarrierSelected()
    copy.barrier = existing.barrier
    copy.explanation = existing.explanation
    copy.affectedbyIntervention = existing.affectedbyIntervention

    copy.characteristics = (existing.characteristics || []).map(
      (c: any) => (this.barrierChList || []).find((o: any) => o.id === c.id) || c,
    )
    this.barrierSelected = copy
    this.editingBarrierIndex = index
    this.barrierBox = true
  }

  deleteBarrier(index: number) {
    this.finalBarrierList.splice(index, 1)
  }
  barriersNameArray(Characteristics: any[]) {
    if (Characteristics?.length > 0) {
      let charArray = Characteristics.map(x => { return x.name });
      return charArray.join(", ")
    }
    else {
      return "-"
    }

  }

  toDownload() {
    this.isDownloadMode = 1;

  }
  showDialog() {
    this.editingBarrierIndex = -1;
    this.barrierSelected = new BarrierSelected();
    this.barrierBox = true;
  }
  selectedTrack: any

  onChangeTrack(event: any) {
    this.track4Selectt = true
    this.selectedTrack = event.value;

    if (this.selectedTrack === 'Track 1' || this.selectedTrack === 'Track 2' || this.selectedTrack === 'Track 3') {
      this.track4Selectt = false
    }
  }


  selectAssessmentType(e: any) {

  }

  onItemSelectImpacts(event: any) {
  }



  onMainTabChange(event: any) {
    this.mainTabIndex = event.index;
    for (let i = 0; i < 2; i++) {
      if (i == 0) {
        if (!this.isFirstLoading0) {
          this.checkTab1Mandatory(4)

          this.maintabIsValid[i] = true
          for (let k of Object.keys(this.tab1IsValid)) {
            if (!this.tab1IsValid[parseInt(k)]) {
              this.maintabIsValid[i] = false
              break
            }
          }
        }
      } else {
        if (!this.isFirstLoading1) {
          this.checkTab2Mandatory(6)
          this.maintabIsValid[i] = true
          for (let k of Object.keys(this.tabIsValid)) {
            if (!this.tabIsValid[parseInt(k)]) {
              this.maintabIsValid[i] = false
              break
            }
          }
        } else {
          this.isFirstLoading1 = false
        }
      }
    }
    if (this.mainTabIndex === 0) {
      this.lastUpdatedCategory = this.processData[this.activeIndex]
    } else {
      this.lastUpdatedCategory = this.outcomeData[this.activeIndex2]
    }

  }

  onCategoryTabChange(event: any, tabview: TabView, type: string) {

    this.categoryTabIndex = event.index;
    if (!this.failedLikelihoodArray.some(
      element => element.tabIndex === this.categoryTabIndex
    )) {
      this.isLikelihoodDisabled = true;
      this.initialLikelihood = 0

    }
    else {
      this.isLikelihoodDisabled = false;
      this.initialLikelihood = 1
    }

    if (!this.failedRelevanceArray.some(
      element => element.tabIndex === this.categoryTabIndex
    )) {
      this.isRelavanceDisabled = true;
      this.initialRelevance = 0

    }
    else {
      this.isRelavanceDisabled = false;
      this.initialRelevance = 1
    }
    if (type === 'process') {
      this.checkTab1Mandatory(event.index)
      this.lastUpdatedCategory = this.processData[this.activeIndex]
    } else {
      this.checkTab2Mandatory(event.index)
      this.lastUpdatedCategory = this.outcomeData[this.activeIndex2]
    }
  }

  checkTab1Mandatory(idx: number) {
    for (const [index, category] of this.processData.entries()) {
      if (index < idx) {
        let validation = this.checkValidation(category.data, 'process')
        this.tab1IsValid[index] = validation
        if (!validation) {
          this.notFilledCategories.push(category)
        } else {
          this.notFilledCategories = this.notFilledCategories.filter(o => o.CategoryName !== category.CategoryName)
        }
      }
    }
  }

  checkTab2Mandatory(idx: number) {
    for (const [index, category] of this.outcomeData.entries()) {
      if ((category.CategoryName === 'Adaptation Time frame over which the outcome is sustained' && index <= idx) || index < idx) {
        let validation = false
        if (category.CategoryName === 'SDG Scale of the Outcome') {
          validation = this.sdgValidation(this.sdgDataSendArray2)
        } else if (category.CategoryName === 'SDG Time frame over which the outcome is sustained') {
          validation = this.sdgValidation(this.sdgDataSendArray4)
        } else {
          validation = this.checkValidation(category.data, 'outcome')
        }
        this.tabIsValid[index] = validation
        if (validation) {
          this.notFilledCategories = this.notFilledCategories.filter(o => o.categoryID !== category.categoryID)
        } else {
          this.notFilledCategories.push(category)
        }
      }
    }
  }

  getSelectedHeader() {
  }


  async saveDraft(category: any, processDraftLocation: string, type: string, isAutoSaving: boolean = false, isDefault?: boolean) {
    this.isSavingDraft = true

    let finalArray = this.processData.concat(this.outcomeData)
    if (this.isEditMode == true) {
      this.assessment = await this.assessmentControllerServiceProxy.findOne(this.assessmentId).toPromise();
      finalArray.map(x => x.data.map(y => y.assessment = this.assessment));
    }
    else {
      finalArray.map(x => x.data.map(y => y.assessment = this.mainAssessment))
    }

    for (let i = 0; i < this.sdgDataSendArray2.length; i++) {
      for (let item of this.sdgDataSendArray2[i].data) {
        item.portfolioSdg = this.selectedSDGs[i];
      }

    }

    for (let i = 0; i < this.sdgDataSendArray4.length; i++) {
      for (let item of this.sdgDataSendArray4[i].data) {
        item.portfolioSdg = this.selectedSDGs[i];
      }
    }

    let proDraftLocation = this.assessment.processDraftLocation;
    let outDraftLocation = this.assessment.outcomeDraftLocation;

    if (type == 'pro') {
      proDraftLocation = processDraftLocation
    }
    if (type == 'out') {
      outDraftLocation = processDraftLocation
    }

    let data: any = {
      finalArray: finalArray,
      isDraft: true,
      isEdit: this.isEditMode,
      proDraftLocation: proDraftLocation,
      outDraftLocation: outDraftLocation,
      lastDraftLocation: type,
      scaleSDGs: this.sdgDataSendArray2,
      sustainedSDGs: this.sdgDataSendArray4,
      sdgs: this.selectedSDGsWithAnswers
    }
    await this.investorToolControllerproxy.createFinalAssessment2(data)
      .subscribe(async _res => {
        this.isSavingDraft = false
        if (!isDefault) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Assessment draft has been saved successfully',
            closable: true,
          })
        }
        if (data.isDraft) {
          this.setFrom()
          this.setTo()
        }
        if (this.isEditMode == false && !isAutoSaving) {
          this.isFirst = true;
          this.router.navigate(['app/general-tool-edit'], {
            queryParams: { id: this.mainAssessment.id, isEdit: true },
          });
        }
        ;
      }, error => {
        this.isSavingDraft = false
        if (!isDefault) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Assessment detail saving failed',
            closable: true,
          })
        }
      }, () => {
        if (this.isLogoutClicked) {
          this.appService.autoSavingDone.next(true)
          this.appService.loginOut.next(false)
        }

      })
  }

  saveResultInAutoSave(data: FinalInvestorAssessmentDto) {
    this.investorToolControllerproxy.createFinalAssessment2(data).subscribe(res => {

      if (!this.isEditMode) {
        this.router.navigate(['app/general-tool-edit'], {
          queryParams: { id: this.mainAssessment.id, isEdit: true },
        });
      }

    })
  }

  checkSustainSDGIsFilled() {
    for (let sdgData of this.sdgDataSendArray4) {
      if (sdgData.data.length > 0) {
        for (let data of sdgData.data) {
          if (!data.score) {
            return false;
          }
        }
      } else {
        return false;
      }
    }
    return true;
  }

  checkMandatory() {
    for (let item of this.processData) {
      for (let item2 of item.data) {
        if ((item2.likelihood == null || item2.relavance == null) && item2.relavance != 0) {
          this.messageService.add({
            severity: 'error',
            summary: 'Warning',
            detail: 'Fill all mandatory fields',
            closable: true,
          })

          return false
        }
      }
    }

    for (let item of this.processData) {
      if (!this.checkValidation(item.data, 'process')) {
        this.messageService.add({
          severity: 'error',
          summary: 'Warning',
          detail: 'Fill all mandatory justification fields',
          closable: true,
        })
        return false
      }
    }

    /**There is an issue  in setting score and justification for sustained adaptation.
     * calling saveDraft is a tempory solution. Need to find a proper solution
    */
    // this.saveDraft(this.outcomeData[5], this.outcomeData[5].CategoryName, 'out', true)
    for (let item of this.outcomeData) {
      if (!this.checkValidation(item.data, 'outcome')) {
        this.messageService.add({
          severity: 'error',
          summary: 'Warning',
          detail: 'Fill all mandatory justification fields',
          closable: true,
        })
        return false
      }
    }

    if (!this.sdgValidation(this.sdgDataSendArray2)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Warning',
        detail: 'Fill all mandatory fields in scale sdg',
        closable: true,
      })
      return false
    }

    if (!this.sdgValidation(this.sdgDataSendArray4)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Warning',
        detail: 'Fill all mandatory fields sustained sdg',
        closable: true,
      })
      return false
    }
    return true
  }

  async onsubmit(form: NgForm, updateData?: { category?: any, type: string }) {

    if (this.assessment.assessment_approach === 'Direct') {
      if (this.isCompleted) {
        this.confirmationService.confirm({
          message: `Are you sure want to update`,
          header: 'Confirmation',
          acceptIcon: 'icon-not-visible',
          rejectIcon: 'icon-not-visible',
          acceptLabel: 'Update',
          rejectLabel: 'Go back',
          key: 'updateConfirm',
          accept: async () => {
            if (updateData?.category?.categoryCode === 'SCALE_SD' && this.isCompleted && !this.checkSustainSDGIsFilled()) {
              if (!this.sdgValidation(this.sdgDataSendArray2)) {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Warning',
                  detail: 'Fill all mandatory fields in scale sdg',
                  closable: true,
                })
                return
              }
              this.confirmationService.confirm({
                message: 'Pls make sure to update "Time frame outcome is sustained section" to update the result.',
                header: 'Warning',
                acceptLabel: 'Okay',
                rejectLabel: 'Cancel',
                accept: () => {
                  if (updateData) { this.next(updateData.category, updateData.type) }
                }, reject: () => { }
              })
            } else {
              if (!this.checkMandatory()) {
                return
              } else {
                this.saveResults()
              }
            }
          },
          reject: () => {

          },
        });
      } else {
        if (!this.checkMandatory()) {
          return
        } else {
          this.saveResults()
        }
      }


    }
    else {
      if (!this.checkMandatory()) {
        return
      } else {
        let finalArray = this.processData.concat(this.outcomeData)
        finalArray.map(x => x.data.map(y => y.assessment = this.mainAssessment));
        //@ts-ignore - We are accepting Array in back-end
        this.investorToolControllerproxy.createFinalAssessmentIndirect(finalArray)
          .subscribe(_res => {
            let task = this.isCompleted ? 'updated' : 'created'
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: `Assessment has been ${task} successfully`,
              closable: true,
            })
            this.showResults();

          }, error => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Assessment detail saving failed',
              closable: true,
            })
          })
      }
    }


  }

  async saveResults() {
    let finalArray = this.processData.concat(this.outcomeData)
    if (this.isEditMode == true) {
      this.assessment = await this.assessmentControllerServiceProxy.findOne(this.assessmentId).toPromise()
      finalArray.map(x => x.data.map(y => y.assessment = this.assessment));
    }
    else {
      finalArray.map(x => x.data.map(y => y.assessment = this.mainAssessment))
    }

    for (let i = 0; i < this.sdgDataSendArray2.length; i++) {
      for (let item of this.sdgDataSendArray2[i].data) {
        item.portfolioSdg = this.selectedSDGs[i];
      }

    }

    for (let i = 0; i < this.sdgDataSendArray4.length; i++) {
      for (let item of this.sdgDataSendArray4[i].data) {
        item.portfolioSdg = this.selectedSDGs[i];
      }

    }

    let data: any = {
      finalArray: finalArray,
      scaleSDGs: this.sdgDataSendArray2,
      sustainedSDGs: this.sdgDataSendArray4,
      sdgs: this.selectedSDGsWithAnswers,
      isEdit: this.isEditMode,
      isDraft: false,
    }

    this.investorToolControllerproxy.createFinalAssessment2(data)
      .subscribe(_res => {
        let task = this.isCompleted ? 'updated' : 'created'
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Assessment has been ${task} successfully`,
          closable: true,
        })
        if (!this.isCompleted) {
          this.showResults();
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


  async showResults() {
    if (this.isEditMode == true) {
      this.assessment = await this.assessmentControllerServiceProxy.findOne(this.assessmentId).toPromise()
      setTimeout(() => {
        this.router.navigate(['../assessment-result-investor', this.assessment.id], { queryParams: { assessmentId: this.assessment.id }, relativeTo: this.activatedRoute });
      }, 2000);
    }
    else {
      setTimeout(() => {
        this.router.navigate(['../assessment-result-investor', this.mainAssessment.id], { queryParams: { assessmentId: this.mainAssessment.id }, relativeTo: this.activatedRoute });
      }, 2000);
    }
  }

  checkValidation(data: any[], type: string) {
    let isValid: boolean = false
    for (let investorAssessment of data) {
      if (type === 'process') {
        if (investorAssessment.relavance === 0) {
          isValid = true;
        } else {
          if (
            (investorAssessment.relavance !== undefined && investorAssessment.relavance !== null) &&
            (investorAssessment.likelihood !== undefined && investorAssessment.likelihood !== null) &&
            (investorAssessment.likelihood_justification !== undefined && investorAssessment.likelihood_justification !== null && investorAssessment.likelihood_justification !== '')
          ) {
            isValid = true
          } else {
            isValid = false
            break;
          }
        }
      } else {
        for (let investorAssessment of data) {
          if (["SUSTAINED_GHG", "SUSTAINED_ADAPTATION"].includes(investorAssessment.category.code) || ["SUSTAINED_GHG", "SUSTAINED_ADAPTATION"].includes(investorAssessment.characteristics.category?.code)) {
            if (
              (investorAssessment.justification !== undefined && investorAssessment.justification !== null && investorAssessment.justification !== '') &&
              (investorAssessment.score !== undefined && investorAssessment.score !== null)
            ) {
              isValid = true
            } else {
              isValid = false
              break;
            }
          } else if (['SCALE_SD', 'SUSTAINED_SD'].includes(investorAssessment.characteristics.category?.code) || ['SCALE_SD', 'SUSTAINED_SD'].includes(investorAssessment.category?.code)) {
            isValid = true
            continue;
          } else {
            if (
              (investorAssessment.justification !== undefined && investorAssessment.justification !== null && investorAssessment.justification !== '') &&
              (investorAssessment.score !== undefined && investorAssessment.score !== null)
            ) {
              isValid = true
            } else {
              isValid = false
              break;
            }
          }
        }
      }
    }
    return isValid;
  }

  sdgValidation(data: any[]) {
    if (this.selectedSDGs.length < 0) {
      return false
    } else {
      let isValid: boolean = false;
      data.forEach(sdg => {
        for (let data of sdg.data) {
          if (data.characteristics?.category?.code === "SUSTAINED_SD" || data.category.code === "SUSTAINED_SD") {
            if ((data.justification !== undefined && data.justification !== null && data.justification !== '') && (data.score !== undefined && data.score !== null)) {
              isValid = true
            } else {
              isValid = false
              break;
            }
          } else {
            if ((data.justification !== undefined && data.justification !== null && data.justification !== '') && (data.score !== undefined && data.score !== null)) {
              isValid = true
            } else {
              isValid = false
              break;
            }
          }
        }
      })
      return isValid
    }
  }

  next(data: {

    isValidated: boolean | null
    data: any[],

  }, type: string) {
    data.isValidated = false;
    if (this.checkValidation(data.data, type)) {
      data.isValidated = true;
      if (this.activeIndexMain === 1) {
        this.activeIndex2 = this.activeIndex2 + 1;
        this.checkTab2Mandatory(this.activeIndex2)

      }
      if (this.activeIndex === 3 && this.activeIndexMain !== 1) {
        this.activeIndexMain = 1;
        this.activeIndex2 = 0;

      }
      if (this.activeIndex <= 2 && this.activeIndex >= 0 && this.activeIndexMain === 0) {
        this.activeIndex = this.activeIndex + 1;
        this.checkTab1Mandatory(this.activeIndex)

      }
      if (this.activeIndexMain === 0) {
        this.lastUpdatedCategory = this.processData[this.activeIndex]
      } else {
        this.lastUpdatedCategory = this.outcomeData[this.activeIndex2]
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
  nextSDG(data: any[], type: string) {
    if (type == 'scaleSD') {
      this.isValidSCaleSD = false
    }
    if (type == 'sustainedSD') {
      this.isValidSustainedSD = false
    }
    if (this.sdgValidation(data)) {
      this.isValidSCaleSD = true
      if (type == 'scaleSD') {
        this.isValidSCaleSD = true
      }
      if (type == 'sustainedSD') {
        this.isValidSustainedSD = true
      }
      if (this.activeIndexMain === 1) {

        this.activeIndex2 = this.activeIndex2 + 1;
        this.checkTab2Mandatory(this.activeIndex2)

      }
      if (this.activeIndex === 3 && this.activeIndexMain !== 1) {
        this.activeIndexMain = 1;
        this.activeIndex2 = 0;

      }
      if (this.activeIndex <= 2 && this.activeIndex >= 0 && this.activeIndexMain === 0) {
        this.activeIndex = this.activeIndex + 1;

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

  getCategory(characteristics: any, category: any) {
    this.characteristicsArray = [];
    for (let x of this.characteristicsList) {
      if (x.category.name === category) {
        this.characteristicsArray.push(x)
      }
    }
    return this.characteristicsArray
  }


  characteristicWeightScore: CharacteristicWeight = {};
  chaCategoryWeightTotal: ChaCategoryWeightTotal = {};
  chaCategoryTotalEqualsTo1: ChaCategoryTotalEqualsTo1 = {};

  characteristicLikelihoodWeightScore: CharacteristicWeight = {};
  chaCategoryLikelihoodWeightTotal: ChaCategoryWeightTotal = {};
  chaCategoryLikelihoodTotalEqualsTo1: ChaCategoryTotalEqualsTo1 = {};





  onLikelihoodWeightChange(categoryName: string, characteristicName: string, chaWeight: number) {
    this.isLikelihoodDisabled = false;
    this.initialLikelihood = 1
    this.characteristicLikelihoodWeightScore[characteristicName] = chaWeight
    this.chaCategoryLikelihoodWeightTotal[categoryName] = 0
    this.chaCategoryLikelihoodTotalEqualsTo1[categoryName] = false

    for (let cha of this.getCategory(characteristicName, categoryName)) {
      if (!isNaN(this.characteristicLikelihoodWeightScore[cha.name])) {
        this.chaCategoryLikelihoodWeightTotal[categoryName] = this.chaCategoryLikelihoodWeightTotal[categoryName] + this.characteristicLikelihoodWeightScore[cha.name]
      }
    }

    if (this.chaCategoryLikelihoodWeightTotal[categoryName] == 100 || this.chaCategoryLikelihoodWeightTotal[categoryName] == 0) {
      this.chaCategoryLikelihoodTotalEqualsTo1[categoryName] = true
      this.initialLikelihood = 0
      this.isLikelihoodDisabled = true;
      this.failedLikelihoodArray = this.failedLikelihoodArray.filter((element) => element.category !== categoryName);

    }
    else {
      if (!this.failedLikelihoodArray.some((element) => element.category === categoryName)) {
        this.failedLikelihoodArray.push({ category: categoryName, tabIndex: this.activeIndex });
      }
    }

  }


  onRelevanceWeightChange(categoryName: string, characteristicName: string, chaWeight: number) {
    this.isRelavanceDisabled = false;
    this.initialRelevance = 1;
    this.characteristicWeightScore[characteristicName] = chaWeight
    this.chaCategoryWeightTotal[categoryName] = 0
    this.chaCategoryTotalEqualsTo1[categoryName] = false

    for (let cha of this.getCategory(characteristicName, categoryName)) {
      if (!isNaN(this.characteristicWeightScore[cha.name])) {
        this.chaCategoryWeightTotal[categoryName] = this.chaCategoryWeightTotal[categoryName] + this.characteristicWeightScore[cha.name]
      }
    }

    if (this.chaCategoryWeightTotal[categoryName] == 100 || this.chaCategoryWeightTotal[categoryName] == 0) {
      this.chaCategoryTotalEqualsTo1[categoryName] = true
      this.initialRelevance = 0
      this.isRelavanceDisabled = true
      this.failedRelevanceArray = this.failedRelevanceArray.filter((element) => element.category !== categoryName);
    }
    else {
      if (!this.failedRelevanceArray.some((element) => element.category === categoryName)) {
        this.failedRelevanceArray.push({ category: categoryName, tabIndex: this.activeIndex });
      }
    }

  }

  onChangeApproach(event: any) {
    this.selectedApproach = event.value;
  }

  onUpload(event: UploadEvent, data: InvestorAssessment) {
    if (event.originalEvent.body) {
      data.uploadedDocumentPath = event.originalEvent.body.fileName
    }

    this.messageService.add({ severity: 'info', summary: 'File Uploaded', detail: '' });
  }


  addNewline(text: any) {
    if (!text) {
      return '';
    }
    return text.replace(/ {3}/g, '<br><br>');
  }

  touchedState: { [key: string]: boolean } = {};

  onBlur(data: any) {
    this.touchedState[data.characteristics.name] = true;
  }

  onChangeRelevance(relevance: any, data: any) {
    this.touchedState[data.characteristics.name] = true;

    if (relevance == 0) {
      data.likelihood_justification = null;
      data.likelihood = null;
      data.uploadedDocumentPath = null;
    }
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

  barrierBox2: boolean = false;

  showBarrierDialog() {
    this.barrierBox2 = true;
  }

  hideBarrierDialog() {
    this.barrierBox2 = false;
  }

  onSelectIntervention(event: any) {
    this.minDate = new Date(event.value.dateOfImplementation)

    if (!this.isEditMode) {
      this.from_date = new Date(event.value.dateOfImplementation);
      this.onSelectFromDate(this.from_date);
    }

    this.geographicalArea = this.geographicalAreasCovered.find(item => {
      if (item.name == this.assessment.climateAction.geographicalAreaCovered) {
        return item
      }
    })
    this.sectorList = this.assessment.climateAction.policySector.map(i => i.sector)
    this.sectorArray = this.sectorList
  }

  onChangeGeoAreaCovered() {
    if (this.assessment.climateAction.geographicalAreaCovered && this.geographicalArea.name !== this.assessment.climateAction.geographicalAreaCovered) {
      this.confirmationService.confirm({
        message: `You selected a geographical scope that deviates from the one that was assigned to this intervention- ${this.assessment.climateAction.geographicalAreaCovered}. Are you sure you want to continue with this selection?`,
        header: 'Confirmation',
        acceptIcon: 'icon-not-visible',
        rejectIcon: 'icon-not-visible',
        acceptLabel: 'Continue',
        rejectLabel: 'Go back',
        key: 'geoConfirm',
        accept: () => {
        },
        reject: () => {
          if (this.isCompleted) {
            this.geographicalArea = this.geographicalAreasCovered.find(item => {
              if (item.name == this.assessment['geographicalAreasCovered'][0].name) {
                return item
              }
            })
          }
          else {
            this.geographicalArea = this.geographicalAreasCovered.find(item => {
              if (item.name == this.assessment.climateAction.geographicalAreaCovered) {
                return item
              }
            })
          }
        },
      });
    }
  }

  onItemSelectSectors(event: any) {
    if (this.assessment.climateAction.policySector) {
      if (this.assessment.climateAction.policySector.length != this.sectorArray.length) {
        this.closeMultiSelect();
        this.confirmationService.confirm({
          message: `You selected sectors that deviates from the one that was assigned to this intervention- ${this.assessment.climateAction.policySector.map(i => i.sector.name).join(",")}. Are you sure you want to continue with this selection?`,
          header: 'Confirmation',
          acceptIcon: 'icon-not-visible',
          rejectIcon: 'icon-not-visible',
          acceptLabel: 'Continue',
          rejectLabel: 'Go back',
          key: 'sectorConfirm',
          accept: () => {
          },
          reject: () => {
            if (!this.isCompleted) {
              this.sectorArray = this.sectorList
            } else {
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

  getTooltipData(ch: string) {
    switch (ch) {
      case 'International/global level':
        return this.ghg_score_info.macro
      case 'National/Sectoral level':
        return this.ghg_score_info.medium
      case 'Subnational/regional/municipal or sub sectoral level':
        return this.ghg_score_info.micro
      default:
        return ''
    }
  }

  onSelectFromDate(event: any) {
    this.minDateTo = new Date(event)
  }

  getNotFilledCaution(): string {
    let str: string = 'Please fill '
    let sections: string[] = []
    for (let notFilled of this.notFilledCategories) {
      sections.push(notFilled.CategoryName)
    }
    sections = [... new Set(sections)]
    str = str + sections.join(', ') + ' sections before continue.'
    return str
  }

  adaptationJustificationChange(data: InvestorAssessment) {
    if (data.category?.code === 'SUSTAINED_ADAPTATION' || data.characteristics.category?.code === 'SUSTAINED_ADAPTATION') {
      this.checkTab2Mandatory(6)
    }
  }

  autoFillInternational() {
    let geoArea = ''
    if (this.isEditMode === false) {
      geoArea = this.geographicalArea.code
    } else {
      geoArea = this.assessment['geographicalAreasCovered'][0].code
    }
    if (['NATIONAL', 'SUBNATIONAL'].includes(geoArea)) {
      for (let category of this.outcomeData) {
        let score = this.masterDataService.outcomeScaleScore.find(s => s.value === 99)
        if (['SCALE_GHG'].includes(category.categoryCode)) {
          category.data = category.data.map(data => {
            if (data.characteristics.code === "MACRO_LEVEL") {
              if (score?.value && !data.score) { data.score = score.value }
              if (!data.justification) data.justification = 'The geographical area covered by this assessment is ' + (geoArea === 'NATIONAL' ? 'national/sectoral' : 'sub-national/sub-sectoral.');
            }
            return data;
          })
        } else if (category.categoryCode === "SCALE_SD") {
          for (let sdg of this.sdgDataSendArray2) {
            this.sdgDataSendArray2.data = sdg.data.map((data: any) => {
              if (data.characteristics.code === "MACRO_LEVEL") {
                if (score?.value && !data.score) { data.score = score.value }
                if (!data.justification) data.justification = 'The geographical area covered by this assessment is ' + (geoArea === 'NATIONAL' ? 'national/sectoral' : 'sub-national/sub-sectoral.');
              }
              return data;
            })
          }
        } else if (category.categoryCode === 'SCALE_ADAPTATION') {
          category.data = category.data.map(data => {
            if (data.characteristics.code === "INTERNATIONAL") {
              if (score?.value && !data.score) { data.score = score.value }
              if (!data.justification) data.justification = 'The geographical area covered by this assessment is ' + (geoArea === 'NATIONAL' ? 'national/sectoral' : 'sub-national/sub-sectoral.');
            }
            return data;
          })
        }
      }
    }
  }

  onSelectScore(category: OutcomDataDto, characteristicCode: string, sdgIndex?: number) {

  }

  isMandatoryActive(category_code: string, characteristic_code: string) {
    return ['MACRO_LEVEL', 'MEDIUM_LEVEL', 'MICRO_LEVEL', 'INTERNATIONAL', 'NATIONAL', 'SUBNATIONAL', 'LONG_TERM', 'MEDIUM_TERM', 'SHORT_TERM'].includes(characteristic_code) || category_code === 'SUSTAINED_ADAPTATION';
  }

  checkCategory(categoryCode: string, CharateristiCode: string) {
    let isWarning = false

    if ((categoryCode == 'SCALE_GHG' || categoryCode == 'SCALE_ADAPTATION') && ['MACRO_LEVEL', 'INTERNATIONAL'].includes(CharateristiCode)) {
      isWarning = true
    }
    else if (categoryCode == 'SUSTAINED_GHG' || categoryCode == 'SUSTAINED_ADAPTATION') {
      isWarning = true
    }
    return isWarning
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

interface UploadEvent {
  originalEvent: HttpResponse<FileDocument>;
  files: File[];
}

interface FileDocument {
  fileName: string
}
