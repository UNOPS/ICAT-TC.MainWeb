import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Assessment, CMAnswer, CMAssessmentQuestion, CMAssessmentQuestionControllerServiceProxy, CMQuestion, CMQuestionControllerServiceProxy, CMResultDto, Criteria, SaveCMResultDto } from 'shared/service-proxies/service-proxies';

@Component({
  selector: 'app-cm-section',
  templateUrl: './cm-section.component.html',
  styleUrls: ['./cm-section.component.css']
})
export class CmSectionComponent implements OnInit {

  @Input() assessment: Assessment

  openAccordion = 0

  sections: any[] = []
  criterias: any[] = []

  prev_answer: CMAnswer

  shownQuestions: any[] = []
  shownCriterias: any[] = []
  shownSections: boolean[] = []

  recievedQuestions: number[] = []

  result: any 

  constructor(
    private cMQuestionControllerServiceProxy: CMQuestionControllerServiceProxy,
    private cMAssessmentQuestionControllerServiceProxy: CMAssessmentQuestionControllerServiceProxy,
    private messageService: MessageService,
    private activatedRoute:ActivatedRoute,
    private router: Router,
  ) { }

  async ngOnInit(): Promise<void> {
    await this.getSections()
    this.onOpenTab({index: 0})
    this.shownQuestions[0] = []
    this.shownQuestions[0].push([])
    this.shownQuestions[0][0] = []
    this.shownQuestions[0][0].push(true)
    this.shownCriterias[0] = []
    this.shownCriterias[0].push(true)
    this.shownSections.push(true)


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

  }

  async getSections(){
    let res = await this.cMQuestionControllerServiceProxy.getAllSection().toPromise()
    this.sections = res.sort((a,b) => a.order - b.order)
  }

  async getCriteriaBySection(sectionId: number){
    let res = await this.cMQuestionControllerServiceProxy.getCriteriaBySectionId(sectionId).toPromise()
    let _criterias = res.sort((a,b) => a.order - b.order)
    _criterias = await Promise.all(
      _criterias.map(async criteria => {
        let q = await this.cMQuestionControllerServiceProxy.getQuestionsByCriteria(criteria.id).toPromise()
        criteria['questions'] = q
        return criteria
      })
    )
    this.criterias.push(_criterias)

  }

  async onOpenTab(e: any){
    let section = this.sections[e.index]
    await this.getCriteriaBySection(section.id)
  }

  onAnswer(e: any, criteria: any, sectionIdx: number, criteriaIdx: number, idx: number ) {
    console.log(this.result)
    this.prev_answer = e.answer
    let question = criteria.questions[idx]
    if (e.type === 'COMMENT'){
      this.result.sections[sectionIdx].criteria[criteriaIdx].questions[idx]['comment'] = e.comment
    } else {
      this.result.sections[sectionIdx].criteria[criteriaIdx].questions[idx]['answer'] = e.answer
      this.result.sections[sectionIdx].criteria[criteriaIdx].questions[idx]['question'] = question

      if (criteria.questions.length === idx + 1 && !this.recievedQuestions.includes(idx)) {
        if (e.type === 'MULTI') {
          if (this.criterias[sectionIdx]?.length === this.shownCriterias[sectionIdx].length){
            // this.openAccordion = this.openAccordion + 1
            this.shownSections.push(true)
            this.shownCriterias[sectionIdx+1] = [true]
            this.shownQuestions[sectionIdx+1][0] = [true]
            if (!this.result.sections[sectionIdx+1] && this.result.sections.length !== this.sections.length){
              this.result.sections.push({id: sectionIdx+1})
              this.result.sections[sectionIdx+1]['criteria'] = [{id: 0}]
              this.result.sections[sectionIdx+1].criteria[0]['questions'] = [{id: 0}]
            }
          } else {
            this.shownCriterias[sectionIdx].push(true)
            this.shownQuestions[sectionIdx][criteriaIdx+1] = [true]
            if (!this.result.sections[sectionIdx].criteria[criteriaIdx+1]){
              this.result.sections[sectionIdx].criteria.push({id: criteriaIdx+1})
              this.result.sections[sectionIdx].criteria[criteriaIdx+1]['questions'] = [{id: 0}]
            } 
          }
  
          this.recievedQuestions = []
        } else {
          if (this.prev_answer.isPassing){
            if (this.criterias[sectionIdx]?.length === this.shownCriterias[sectionIdx].length){
              this.shownSections.push(true)
              this.shownCriterias[sectionIdx+1] = [true]
              this.shownQuestions[sectionIdx+1] = []
              this.shownQuestions[sectionIdx+1][0] = [true]
              if (!this.result.sections[sectionIdx+1] && this.result.sections.length !== this.sections.length){
                this.result.sections.push({id: sectionIdx+1})
                this.result.sections[sectionIdx+1]['criteria'] = [{id: 0}]
                this.result.sections[sectionIdx+1].criteria[0]['questions'] = [{id: 0}]
              }
            } else {
              this.shownCriterias[sectionIdx].push(true)
              this.shownQuestions[sectionIdx][criteriaIdx+1] = [true]
              this.shownQuestions.push(true)
              if (!this.result.sections[sectionIdx].criteria[criteriaIdx+1]){
                this.result.sections[sectionIdx].criteria.push({id: criteriaIdx+1})
                this.result.sections[sectionIdx].criteria[criteriaIdx+1]['questions'] = [{id: 0}]
              } 
            }
    
            this.recievedQuestions = []
          } else {
            alert("TC score is 0")
          }
        }
      } else {
        if (e.type === 'MULTI' && !this.recievedQuestions.includes(idx)){
          this.shownQuestions[sectionIdx][criteriaIdx].push(true)
          if (!this.result.sections[sectionIdx].criteria[criteriaIdx].questions[idx+1]){
            this.result.sections[sectionIdx].criteria[criteriaIdx].questions.push({id: idx+1})
          }
        } else {
            if (this.prev_answer.isPassing) {
              this.shownQuestions[sectionIdx][criteriaIdx].push(true)
              if (!this.result.sections[sectionIdx].criteria[criteriaIdx].questions[idx+1]){
                this.result.sections[sectionIdx].criteria[criteriaIdx].questions.push({id: idx+1})
              }
            } else {
              alert("TC score is 0")
              this.shownQuestions[sectionIdx][criteriaIdx].splice(idx + 1, this.shownQuestions[sectionIdx][criteriaIdx].length - (idx + 1) )
            }
        }
        this.recievedQuestions.push(idx)
      }
    }
  }


  save(){
    let result: SaveCMResultDto = new SaveCMResultDto()
    result.result = []
    this.result.sections.forEach((section: any) => {
      section.criteria.forEach((cr: any) => {
        cr.questions.forEach((q:any) => {
          let item = new CMResultDto()
          item.answer = q.answer
          item.comment = q.comment
          item.question = q.question
          result.result.push(item)
        })
      })
    })
    result.assessment = this.assessment

    console.log(result)

    this.cMAssessmentQuestionControllerServiceProxy.saveResult(result)
    .subscribe(res => {
      if (res) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Assessment created successfully',
          closable: true,
        })
        this.router.navigate(['../carbon-market-tool-result'], {queryParams: { id: this.assessment.id }, relativeTo:this.activatedRoute});
      }
    }, error => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error in result saving',
        closable: true,
      })
    })
  }

}