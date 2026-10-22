import { Component, Input, OnInit, ViewChild, } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Assessment, CMAnswer, CMAssessmentQuestion, CMAssessmentQuestionControllerServiceProxy, CMQuestion, CMQuestionControllerServiceProxy, CMResultDto, Category, Criteria, Institution, SaveCMResultDto, ScoreDto, Section, ServiceProxy } from 'shared/service-proxies/service-proxies';
import { CmSectionThreeComponent } from '../cm-section-three/cm-section-three.component';
import { AppService } from 'shared/AppService';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cm-section',
  templateUrl: './cm-section.component.html',
  styleUrls: ['./cm-section.component.css']
})
export class CmSectionComponent implements OnInit {

  @Input() assessment: Assessment
  @Input() approach: string
  @Input() isEditMode: boolean;
  @Input() isCompleted: boolean;
  @Input() expectedGhgMitigation: number;
  @Input() beforeSave?: () => Promise<void>;
  @ViewChild('cmSectionThreeComponent') cmSectionThreeComponent: CmSectionThreeComponent

  openAccordion = 0

  sections: any[] = []
  criterias: any[] = []

  prev_answer: CMAnswer

  shownQuestions: any[] = []
  shownCriterias: any[] = []
  shownSections: boolean[] = []

  recievedQuestions: number[] = []
  visible: boolean = false

  result: any
  sectionResult: SectionResultDto = new SectionResultDto()
  isPassed: boolean = false
  preQuestionIdx: number | undefined

  message: string
  defaultMessage = 'The preconditions for transformational change have not been met. <br> Transformational change = 0'
  assessmentQuestions: CMAssessmentQuestion[]
  isFirstLoading: boolean = false
  currentQuestion: number = 0;
  loadedQuestions: number[] = []
  currentCriteria: number = 0
  currentSection: number = 0
  loadedCriterias: number[] = []
  showConditionDialog: boolean;
  visible_condition: boolean;
  condition_message: string;
  emptySaveDto = new SaveDto()
  section2_description = 'Environmental integrity ensures that carbon market activities support global mitigation efforts, importantly not causing a net increase in global GHG ' +
    'emissions compared to a situation where the carbon market activity is not implemented. Social integrity, meanwhile, guarantees the activities benefit local communities and ' +
    'negative impacts are avoided, aligning with broader sustainability goals. Together, these principles steer carbon markets towards activities with outcomes that are beneficial ' +
    'for both the planet and its people.'
  criteria1_description = 'Central to safeguarding environmental integrity is the robust assessment of the additionality of the carbon market intervention and quantification of ' +
    'the activity’s mitigation outcomes. Safeguarding the activity’s additionality means verifying that the activity was triggered by the revenues from the credits’ sale. This can ' +
    'be demonstrated through the application of different additionality tests including a regulatory additionality test (going beyond existing laws and regulations), an investment ' +
    'test and/or a barrier test. For the quantification of mitigation outcomes, it is essential that crediting baselines are set credibly and conservatively and that a robust ' +
    'monitoring concept is in place. The following questions are therefore focusing on the intervention’s approach to additionality determination, baseline setting and monitoring.'
  criteria2_description = 'GHG emissions lock-in refers to the investment in technologies or practices that prevent transitioning to lower-emission technologies or practices in the ' +
    'short term, inhibiting a transformation to low-carbon societies.'
  readyToNavigate: boolean = false

  constructor(
    private cMQuestionControllerServiceProxy: CMQuestionControllerServiceProxy,
    private cMAssessmentQuestionControllerServiceProxy: CMAssessmentQuestionControllerServiceProxy,
    private messageService: MessageService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private serviceProxy: ServiceProxy,
    private appService: AppService
  ) { }

  async ngOnInit(): Promise<void> {
    await this.getSections()
    this.onOpenTab({ index: 0 })
    this.shownQuestions[0] = []
    this.shownQuestions[0].push([])
    this.shownQuestions[0][0] = []
    this.shownQuestions[0][0].push(true)
    this.shownCriterias[0] = []
    this.shownCriterias[0].push(true)
    this.shownSections.push(true)
    if (this.assessment.processDraftLocation || this.assessment.outcomeDraftLocation) {
      this.openAccordion = 1;
      this.shownSections.push(true)
    }
    if (this.isEditMode) this.isFirstLoading = true

    this.result = {
      sections: [
        {
          id: 0,
          criteria: [
            {
              id: 0,
              questions: [
                {
                  id: 0
                }
              ]
            }
          ]
        }
      ]
    }

    await this.setInitialState()

  }

  async setInitialState() {
    if (this.isEditMode) {
      this.assessmentQuestions = await this.cMAssessmentQuestionControllerServiceProxy.getAssessmentQuestionsByAssessmentId(this.assessment.id).toPromise()
    }
  }

  async getSections() {
    let res = await this.cMQuestionControllerServiceProxy.getAllSection().toPromise();
    this.sections = res.sort((a, b) => a.order - b.order);

  }

  async getCriteriaBySection(sectionId: number) {
    let res = await this.cMQuestionControllerServiceProxy.getCriteriaBySectionId(sectionId).toPromise()
    let _criterias = res.sort((a, b) => a.order - b.order);
    _criterias = await Promise.all(
      _criterias.map(async criteria => {
        let q = await this.cMQuestionControllerServiceProxy.getQuestionsByCriteria(criteria.id).toPromise()
        criteria['questions'] = q
        criteria['currentQuestion'] = 0
        return criteria
      })
    )
    this.criterias.push(_criterias)
  }

  async onOpenTab(e: any) {
    let section = this.sections[e.index];
    await this.getCriteriaBySection(section.id);
  }

  onAnswer2(e: any, message: string, question: any, criteria: any, section: any) {
    this.showConditionDialog = false
    if (!this.loadedQuestions.includes(question.id)) {
      criteria.currentQuestion++
      this.loadedQuestions.push(question.id)
    }
    if ((criteria.questions.length === criteria.currentQuestion) && !this.loadedCriterias.includes(criteria.id)) {
      this.currentCriteria++
      this.loadedCriterias.push(criteria.id)
    }

    let sectionDto = this.sectionResult.sections?.find(s => s.section.id === section.id)
    if (!sectionDto) {
      sectionDto = new SectionDto()
      sectionDto.section = section
      sectionDto.criteria = []
      let _criteriaDto = new CriteriaDto()
      _criteriaDto.criteria = criteria
      _criteriaDto.questions = []
      sectionDto.criteria.push(_criteriaDto)
      this.sectionResult.sections = []
      this.sectionResult.sections.push(sectionDto)
    }

    let c = sectionDto.criteria.find(cr => cr.criteria.id === criteria.id)
    let questionDto = new QuestionDto()
    let q
    if (c) {
      q = c.questions.find(_q => _q.question.id === question.id)
    }
    if (q) questionDto = q


    if (e.type === 'COMMENT') {
      questionDto.comment = e.comment
    } else if (e.type === 'FILE') {
      questionDto.file = e.path
      this.criterias[0].map((cr: any) => {
        return cr.questions.map((q: any) => {
          if (q.id === question.id) {
            q['result'] = {}
            q['result']['filePath'] = e.path
          }
          return q
        })
      })
    } else {
      if (e.type === 'INDIRECT') {
        questionDto.institution = e.answer;
      } else {
        if (e.answer.label === 'Unsure') {
          this.message = 'You are allowed to continue with the assessment, but we are strongly encouraged to evaluate all preconditions to ensure that they are met to enable transformational change.'
          if (!e.isLoading) {
            this.visible = true;
          }
        }
        if (!e.answer.isPassing) {
          if (!this.isFirstLoading) {
            this.visible = true;
          } else {
            this.isFirstLoading = false;
          }
          if (message) {
            this.message = message;
          } else {
            this.message = this.defaultMessage;
          }
        }
        questionDto.answer = e.answer;
      }
      questionDto.question = question;
      questionDto.type = e.type;
    }

    this.sectionResult.sections.map(sec => {
      if (sec.section.id === section.id) {
        sec.criteria.map(cr => {
          if (cr.criteria.id === criteria.id) {
            cr.questions.map(q => {
              if (q.question.id === question.id) {
                q.answer = questionDto.answer;
                q.comment = questionDto.comment;
                q.file = questionDto.file;
                q.institution = questionDto.institution;
                q.question = questionDto.question;
                q.type = questionDto.type;
              }
              return q
            })
            if (!cr.questions.find(_q => _q.question?.id === question.id)) {
              cr.questions.push(questionDto);
            }
          }
          return cr
        })
        if (!sec.criteria.find(_cr => _cr.criteria.id === criteria.id)) {
          let _crt = new CriteriaDto()
          _crt.criteria = criteria
          _crt.questions = [questionDto]
          sec.criteria.push(_crt)
        }
      }
      return sec
    })

    if ((this.criterias[0].length === this.currentCriteria)) {
      this.isPassed = true
      let notMetCriterias: any[] = []
      this.sectionResult.sections.forEach(sec => {
        sec.criteria.forEach(cr => {
          cr.questions.forEach(q => {
            if (this.isPassed) { this.isPassed = q.answer.isPassing }
            if (!q.answer.isPassing) {
              notMetCriterias.push(cr.criteria.name)
            }
          })
        })
      })
      if (this.isPassed) {
        this.currentSection++
      } else {
        if (this.currentSection === (this.sections.length - 1)) {
          this.currentSection--
        }
      }

      if (this.isPassed) {
        this.visible_condition = true
        this.condition_message = 'All the criterias have been met.'
      } else {
        this.showConditionDialog = true
        this.visible = true
        notMetCriterias = [... new Set(notMetCriterias)]
        this.visible_condition = true
        this.condition_message = 'Following criterias are not met.<ul>'
        notMetCriterias.forEach(c => {
          this.condition_message = this.condition_message + '<li>' + c + '</li>'
        })
        this.condition_message = this.condition_message + '</ul>'
      }
    }

    if (!e.isLoading) {
      this.autoSaveResult(question.id)
    }

  }

  onAnswer(e: any, message: string, criteria: any, sectionIdx: number, criteriaIdx: number, idx: number) {
    this.prev_answer = e.answer
    let question = criteria.questions[idx]
    if (!this.loadedQuestions.includes(question.id)) {
      this.currentQuestion++
      this.loadedQuestions.push(question.id)
    }
    if (e.type === 'COMMENT') {
      this.result.sections[sectionIdx].criteria[criteriaIdx].questions[idx]['comment'] = e.comment;
    } else if (e.type === 'FILE') {
      this.result.sections[sectionIdx].criteria[criteriaIdx].questions[idx]['file'] = e.path;
      criteria.questions[idx]['result'] = {};
      criteria.questions[idx]['result']['filePath'] = e.path;
    } else {
      if (e.type === 'INDIRECT') {
        this.result.sections[sectionIdx].criteria[criteriaIdx].questions[idx]['institution'] = e.answer;
      } else {
        this.result.sections[sectionIdx].criteria[criteriaIdx].questions[idx]['answer'] = e.answer;
      }
      this.result.sections[sectionIdx].criteria[criteriaIdx].questions[idx]['question'] = question;
      if (this.isEditMode) {
        let q = this.assessmentQuestions.find(o => o.question.id === question.id);
        if (q) {
          this.result.sections[sectionIdx].criteria[criteriaIdx].questions[idx]['assessmentQuestionId'] = q.id;
          this.result.sections[sectionIdx].criteria[criteriaIdx].questions[idx]['assessmentAnswerId'] = q.assessmentAnswers[0].id;
        }
      }
      this.result.sections[sectionIdx].criteria[criteriaIdx].questions[idx]['type'] = e.type;

      if (criteria.questions.length === idx + 1 && !this.recievedQuestions.includes(idx)) {
        this.preQuestionIdx = undefined
        if (e.type === 'MULTI') {
          if (this.criterias[sectionIdx]?.length === this.shownCriterias[sectionIdx].length) {
            if (this.prev_answer.isPassing) {
              this.shownSections.push(true);
              this.shownCriterias[sectionIdx + 1] = [true];
              this.shownQuestions[sectionIdx + 1][0] = [true];
              if (!this.result.sections[sectionIdx + 1] && this.result.sections.length !== this.sections.length) {
                this.result.sections.push({ id: sectionIdx + 1 });
                this.result.sections[sectionIdx + 1]['criteria'] = [{ id: 0 }];
                this.result.sections[sectionIdx + 1].criteria[0]['questions'] = [{ id: 0 }];
              }
            } else {
              this.shownCriterias[sectionIdx].splice(criteriaIdx + 1, this.shownCriterias[sectionIdx].length - (criteriaIdx + 1));
              this.shownSections.splice(sectionIdx + 1, this.shownSections.length - (sectionIdx + 1));
            }
          } else {
            this.shownCriterias[sectionIdx].push(true);
            this.shownQuestions[sectionIdx][criteriaIdx + 1] = [true];
            if (!this.result.sections[sectionIdx].criteria[criteriaIdx + 1]) {
              this.result.sections[sectionIdx].criteria.push({ id: criteriaIdx + 1 });
              this.result.sections[sectionIdx].criteria[criteriaIdx + 1]['questions'] = [{ id: 0 }];
            }
          }

          this.recievedQuestions = []
        } else {
          if (this.prev_answer.isPassing || (e.type === "INDIRECT")) {
            if (e.answer.label === 'Unsure') {
              this.message = 'You are allowed to continue with the assessment, but we are strongly encouraged to evaluate all preconditions to ensure that they are met to enable transformational change.'
              if (!e.isLoading) {
                this.visible = true;
              }
            }
            if (this.criterias[sectionIdx]?.length === this.shownCriterias[sectionIdx].length) {
              this.shownSections.push(true)
              this.isPassed = true
              this.shownCriterias[sectionIdx + 1] = [true];
              this.shownQuestions[sectionIdx + 1] = [];
              this.shownQuestions[sectionIdx + 1][0] = [true];
              if (!this.result.sections[sectionIdx + 1] && this.result.sections.length !== this.sections.length) {
                this.result.sections.push({ id: sectionIdx + 1 });
                this.result.sections[sectionIdx + 1]['criteria'] = [{ id: 0 }];
                this.result.sections[sectionIdx + 1].criteria[0]['questions'] = [{ id: 0 }];
              }
              this.preQuestionIdx = idx;
            } else {
              this.shownCriterias[sectionIdx].push(true);
              this.shownQuestions[sectionIdx][criteriaIdx + 1] = [true];
              if (!this.result.sections[sectionIdx].criteria[criteriaIdx + 1]) {
                this.result.sections[sectionIdx].criteria.push({ id: criteriaIdx + 1 });
                this.result.sections[sectionIdx].criteria[criteriaIdx + 1]['questions'] = [{ id: 0 }];
              }
            }
            this.recievedQuestions = []
          } else {
            if (message) {
              this.message = message;
            } else {
              this.message = this.defaultMessage;
            }
            if (!this.isFirstLoading) {
              this.visible = true;
            } else {
              this.isFirstLoading = false;
            }
            this.shownCriterias[sectionIdx].splice(criteriaIdx + 1, this.shownCriterias[sectionIdx].length - (criteriaIdx + 1));
            this.shownSections.splice(sectionIdx + 1, this.shownSections.length - (sectionIdx + 1));
            this.isPassed = false;
          }
        }
      } else {
        if ((e.type === 'MULTI' || e.type === "INDIRECT") && !this.recievedQuestions.includes(idx)) {
          this.shownQuestions[sectionIdx][criteriaIdx].push(true);
          if (!this.result.sections[sectionIdx].criteria[criteriaIdx].questions[idx + 1]) {
            this.result.sections[sectionIdx].criteria[criteriaIdx].questions.push({ id: idx + 1 });
          }
        } else {
          if (this.prev_answer.isPassing) {
            if (e.answer.label === 'Unsure') {
              this.message = 'You are allowed to continue with the assessment, but we are strongly encouraged to evaluate all preconditions to ensure that they are met to enable transformational change.'
              if (!e.isLoading) {
                this.visible = true;
              }
            }
            if (this.preQuestionIdx !== idx) this.shownQuestions[sectionIdx][criteriaIdx].push(true)
            this.preQuestionIdx = idx;
            if (!this.result.sections[sectionIdx].criteria[criteriaIdx].questions[idx + 1]) {
              this.result.sections[sectionIdx].criteria[criteriaIdx].questions.push({ id: idx + 1 });
            }
          } else {
            if (!this.isFirstLoading) {
              this.visible = true;
            } else {
              this.isFirstLoading = false;
            }
            if (message) {
              this.message = message;
            } else {
              this.message = this.defaultMessage;
            }
            this.shownQuestions[sectionIdx][criteriaIdx].splice(idx + 1, this.shownQuestions[sectionIdx][criteriaIdx].length - (idx + 1));
            this.shownCriterias[sectionIdx].splice(criteriaIdx + 1, this.shownCriterias[sectionIdx].length - (criteriaIdx + 1));
            this.shownSections.splice(sectionIdx + 1, this.shownSections.length - (sectionIdx + 1));
            this.preQuestionIdx = undefined;
          }
        }
        if (!this.recievedQuestions.includes(idx)) {
          this.recievedQuestions.push(idx);
        }
      }
    }
  }


  async save(event: SaveDto) {
    if (event.type) {
      this.shownSections.push(true);
    }
    let result: SaveCMResultDto = new SaveCMResultDto()
    result.result = []
    result.result = [...event?.result]
    this.sectionResult.sections.forEach((section: any) => {
      section.criteria.forEach((cr: any) => {
        cr.questions.forEach((q: any) => {
          let item = new CMResultDto();
          if (q.answer) item.answer = q.answer;
          let ins = new Institution();
          ins.id = q.institution?.id;
          if (q.institution) item.institution = ins;
          item.comment = q.comment;
          item.question = q.question;
          item.type = q.type;
          item.filePath = q.file;
          if (this.isEditMode) {
            let assQ = this.assessmentQuestions.find(o => (o.question.id === q.question?.id))
            if (assQ) {
              item.assessmentQuestionId = assQ.id;
              if (assQ.assessmentAnswers.length > 0) {
                item.assessmentAnswerId = assQ.assessmentAnswers[0]?.id;
              }
            }
          }
          if (item.question) result.result.push(item)
        })
      })
    })
    result.assessment = this.assessment;
    result.isDraft = event.isDraft;
    result.type = event.type;
    result.name = event.name;
    result.expectedGHGMitigation = event.expected_ghg_mitigation
    if (this.beforeSave) {
      try {
        await this.beforeSave()
      } catch (e) { }
    }
    this.cMAssessmentQuestionControllerServiceProxy.saveResult(result)
      .subscribe(res => {
        if (res) {
          let message = ''
          if (event.isDraft) {
            message = 'Assessment saved successfully. You will be able to continue the assessment from the “In progress” menu'
          } else if (this.isCompleted) {
            message = 'Assessment is updated successfully.'
          } else {
            message = 'Assessment created successfully'
          }
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: message,
            closable: true,
          })
          if (event.isDraft && !this.isCompleted) {
            this.isEditMode = true
            this.setInitialState()
            this.router.navigate(['../carbon-market-tool-edit'], { queryParams: { id: this.assessment.id, isEdit: true, isContinue: true }, relativeTo: this.activatedRoute });

          }
          if (result.assessment.assessment_approach === 'DIRECT' && !event.isDraft && !this.isCompleted) {
            this.router.navigate(['../carbon-market-tool-result'], { queryParams: { id: this.assessment.id }, relativeTo: this.activatedRoute });
          }

        }
      }, error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error in result saving',
          closable: true,
        })
      }, () => {
        if (event.isLogoutClicked) {
          this.appService.autoSavingDone.next(true);
          this.appService.loginOut.next(false)
          if (event.logoutSub) {
            event.logoutSub.unsubscribe();
            //@ts-ignore
            event.logoutSub = undefined;
          }
        }
      })
  }

  async autoSaveResult(questionId: number) {
    await this.loadAssessmentQuestions()
    this.sectionResult.sections.forEach((section: any) => {
      section.criteria.forEach((cr: any) => {
        let question = cr.questions.find((q: any) => q.question.id === questionId)
        if (question) {
          let item = new CMResultDto();
          if (question.answer) item.answer = question.answer;
          let ins = new Institution();
          ins.id = question.institution?.id;
          if (question.institution) item.institution = ins;
          item.comment = question.comment;
          item.question = question.question;
          item.type = question.type;
          item.filePath = question.file;
          if (this.isEditMode) {
            let assQ = this.assessmentQuestions.find(o => (o.question.id === question.question?.id))
            if (assQ) {
              item.assessmentQuestionId = assQ.id;
              if (assQ.assessmentAnswers.length > 0) {
                item.assessmentAnswerId = assQ.assessmentAnswers[0]?.id;
              }
            }
          }
          let cmResult: SaveCMResultDto = new SaveCMResultDto();
          cmResult.result = [item];
          cmResult.assessment = this.assessment;
          cmResult.isDraft = true;
          cmResult.type = '';
          cmResult.name = '';
          this.cMAssessmentQuestionControllerServiceProxy.saveResult(cmResult).subscribe(res => {
            if (res) {
              if (!this.isEditMode) {
                if (this.visible === false) {
                  this.router.navigate(['../carbon-market-tool-edit'], { queryParams: { id: this.assessment.id, isEdit: true, isContinue: true }, relativeTo: this.activatedRoute });
                } else {
                  this.readyToNavigate = true;
                }
              }
            }
          })
        }
      })
    })
  }

  okay() {
    this.visible = false
    if (this.readyToNavigate === true) {
      this.readyToNavigate = false;
      this.router.navigate(['../carbon-market-tool-edit'], { queryParams: { id: this.assessment.id, isEdit: true, isContinue: true }, relativeTo: this.activatedRoute });
    }
  }

  okayCondition() {
    this.visible_condition = false
  }

  onSubmitSectionThree($event: any) {
    throw new Error('Method not implemented.');
  }

  async loadAssessmentQuestions() {
    this.assessmentQuestions = await this.cMAssessmentQuestionControllerServiceProxy.getAssessmentQuestionsByAssessmentId(this.assessment.id).toPromise()
  }

}

export class SaveDto {
  result: CMResultDto[] = []
  isDraft: boolean = false
  name: string = ''
  type: string = ''
  expected_ghg_mitigation: number = 0
  isLogoutClicked: boolean = false
  logoutSub?: Subscription
}

export class SectionResultDto {
  sections: SectionDto[]
}

export class SectionDto {
  section: Section
  criteria: CriteriaDto[]
}

export class CriteriaDto {
  criteria: Criteria
  questions: QuestionDto[]
}

export class QuestionDto {
  answer: CMAnswer
  institution: Institution
  comment: string
  question: CMQuestion
  type: string
  file: string
}
