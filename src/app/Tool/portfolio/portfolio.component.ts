import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { Institution, InstitutionControllerServiceProxy, MethodologyAssessmentControllerServiceProxy, ProjectControllerServiceProxy, ServiceProxy } from 'shared/service-proxies/service-proxies';
import { HttpClient } from '@angular/common/http';
import {  Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {Chart} from 'chart.js';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { environment } from 'environments/environment';
import decode from 'jwt-decode';



@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css']
})
export class PortfolioComponent implements OnInit {


  @ViewChild('myCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;


  baseURL:string=environment.baseUrlAPI;
  avg1 = 2;
  avg2 = 2;
selectedIndicator: string;

  constructor(
    private methassess : MethodologyAssessmentControllerServiceProxy,
    private climateAction : ProjectControllerServiceProxy,
    private router: Router,
    private serviceProxy: ServiceProxy,
    private institutionProxy: InstitutionControllerServiceProxy,
    private route: ActivatedRoute,
    private httpClient: HttpClient, private messageService: MessageService
  ) {

  }

  selectedType = 'opentype';
  meth1:boolean;

  methList: any= [];
  methListAll :any = [];
  categotyList :any = [];
  meth1Process :any = [];
  meth1Outcomes :any = [];
  characteristicsList : any = []
  characteristicsArray : any= []
  methIndicatorsList :any = [];

  policyList : any = []
  policyId : number;

  filteredIndicatorList :any =[]
  selectedIndicatorValue :any

trigger : boolean = false;

  barriersList : any = []
  barrierId : number;
  barrierListobject :any = []
  indicatorList :any = []
  instiTutionList: Institution[];

   averageProcess : number

   averageOutcome : number

   filename : string
   categoryFilename : string
  relevantChaList : any = []

  methId :number;
  dropdownList: { item_id: number, item_text: string }[] = [];
  selectedItems: { id: number; name: string }[] = [];

  dropdownSettings: IDropdownSettings = {};
  dropdownSettings2: IDropdownSettings = {};
  dropdownSettings3: IDropdownSettings = {};
  dropdownSettings4: IDropdownSettings = {};

 dropdownList3: { item_id: number, item_text: string }[] = [];
  dropdownList2: { id: number, policyName: string }[] = [];

  selectedItems2: { id: number, name: string }[] = [];
  selectedItems3: { id: number, name: string }[] = [];
  selectedItems4: { id: number, name: string }[] = [];

  selectedBarriers: { id: number, name: string }[] = [];

  characAffectedByBarriers: { id: number, name: string }[] = [];

  selectedPolicy: any

  assessmentId :number;
  selectChaAffectByBarriers : any = []

  policyBarriersList : any = []
  selectedPolicyBarriersList : any = []
  userCountryId:number = 0;
  sendBarriers : any = []
  isSubmitted : boolean= false;

  characteristics :any = [];

  selectedCategories: string[] = ['Category 1', 'Category 2'];




  chart(): void {
    if (!this.canvasRef) {
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    const gradient = ctx.createLinearGradient(0, 0, 500, 500);
    gradient.addColorStop(0, 'red');
    gradient.addColorStop(0.5, 'yellow');
    gradient.addColorStop(1, 'green');

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'My Dataset',
            data: [{ x: this.averageOutcome, y: this.averageProcess }],
            backgroundColor: gradient,
            borderColor: 'black',
            borderWidth: 1,
            pointRadius: 5,
            pointBackgroundColor: 'blue',
            pointBorderColor: 'black',
            pointBorderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          x: {
            type: 'linear',
            min: 0,
            max: 5,
            ticks: {
              stepSize: 1
            }
          },
          y: {
            type: 'linear',
            min: 0,
            max: 5,
            ticks: {
              stepSize: 1
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const data = context.dataset.data[context.dataIndex];
                return `(${this.averageOutcome}, ${this.averageProcess})`;
              },
            },
          },
        },
      },
    });
  }


  ngOnInit(): void {

    const token = localStorage.getItem('ACCESS_TOKEN')!;
    const tokenPayload = decode<any>(token);
    this.userCountryId  = tokenPayload.countryId;

    this.policyList = [];
    this.barriersList = [];
    this.indicatorList = [];

    let intTypeFilter: string[] = new Array();

    intTypeFilter.push('type.id||$eq||' + 3);

    this.institutionProxy.getInstitution(3,this.userCountryId,1000,0).subscribe((res: any) => {
      this.instiTutionList = res;
    });


  this.methassess.findAllBarriers().subscribe((res: any) => {
      this.barrierListobject = res
      for(let x of res){
        this.barriersList.push(x.barrier);
      }

    });

    this.methassess.findAllPolicyBarriers().subscribe((res: any) => {
      this.policyBarriersList = res;


    });




    this.methassess.findAllIndicators().subscribe((res: any) => {
      this.indicatorList = res;

    });


    this.climateAction.findAllPolicies().subscribe((res: any) => {
      for(let data of res){
        let policyObj = {
          id : data.id,
          policyName : data.policyName
        }

        this.policyList.push(policyObj)
      }

    });

    this.methList = [];
    this.methListAll = [];
    this.characteristicsList = [];
    this.methassess.findAllMethodologies().subscribe((res: any) => {
      for (let x of res) {
        this.methList.push(x.methodology_name);
        this.methListAll.push(x);
      }

    });



    this.categotyList = [];
    this.meth1Process = [];
    this.meth1Outcomes = [];
    this.methassess.findAllCategories().subscribe((res2: any) => {
      for (let x of res2) {
          if(x.type === 'process'){
            this.meth1Process.push(x);
          }
          if(x.type === 'outcome'){
            this.meth1Outcomes.push(x);
          }
      }
    });

    this.methassess.findAllCharacteristics().subscribe((res3: any) => {
      this.characteristicsList = res3;

    });

   this.methassess.findAllMethIndicators().subscribe((res: any) => {
    this.methIndicatorsList = res;

  });




    this.dropdownSettings = {
      singleSelection: false,
      idField: 'id',
      textField: 'name',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 5,
      allowSearchFilter: true
    };

    this.dropdownSettings2 = {
      singleSelection: false,
      idField: 'id',
      textField: 'policyName',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 5,
      allowSearchFilter: true
    };

    this.dropdownSettings3 = {
      singleSelection: false,
      idField: 'id',
      textField: 'barrier',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 2,
      allowSearchFilter: true
    };

    this.dropdownSettings4 = {
      singleSelection: false,
      idField: 'id',
      textField: 'name',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 2,
      allowSearchFilter: true
    };


  }


  flag : boolean = false

   onChange(event:any) {

    this.flag = false
    this.selectedType = event.target.value;
    this.selectedPolicyBarriersList = []

     for(let x of this.policyBarriersList){
        if(x.policyName === this.selectedType){
          for(let barriersss of this.barriersList){
              if(x.barriers.barrier === barriersss)

            this.selectedPolicyBarriersList.push(barriersss);
          }

        }
    }

    setTimeout(() => {
      this.flag = true;
    }, 500);
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

onItemSelect(item: any) {
  this.selectedItems = [];
  for(let x of item.value){
    this.selectedItems.push(x)
  }


}

onItemSelectBarriers(item: any){
  this.selectedPolicyBarriersList = [];
  for(let x of item.value){
    this.selectedPolicyBarriersList.push(x)
  }


}
onItemSelect2(item: any) {
  this.selectedItems2 = [];
  for(let x of item.value){
    this.selectedItems2.push(x)
  }

}


onItemSelect3(item: any) {
  this.selectedItems3 = [];
  for(let x of item.value){
    this.selectedItems3.push(x)
  }

}



onItemSelect4(item: any) {
  this.selectedItems4 = [];
  for(let x of item.value){
    this.selectedItems4.push(x)
  }


}

onItemSelectcha(item :any){
  this.selectChaAffectByBarriers = [];
  for(let x of item.value){
    this.selectChaAffectByBarriers.push(x)
  }


}


onItemSelect6(item: any) {
  this.selectedBarriers = [];
  for(let x of item.value){
    this.selectedBarriers.push(x)
  }

}
onItemSelect7(item: any) {
  this.characAffectedByBarriers = [];
  for(let x of item.value){
    this.characAffectedByBarriers.push(x)
  }

}

 onSubmit(data: any) {
  this.isSubmitted = false;
  this.assessmentId = 0;
  if(data.assessment_approach === 'Indirect' && data.assessment_method === 'Track 1'){
  this.isSubmitted = true;
  }

  let categoryDataArray: any[] = [];
if( data.policy === 'TC Uganda Geothermal'){
  for (let category of this.selectedItems) {
    let categoryData: any = {
      categoryId :category.id,
      category: category.name,
      characteristics: []
    };

    for (let characteristic of this.getCategory(this.characteristicsList, category.name)) {
      let charName = `${category.name}_${characteristic.name}`;
      let charRelevance = `${category.name}_${characteristic.name}_relevance`;
      let charScore = `${category.name}_${characteristic.name}_score`;
      let comment = `${category.name}_${characteristic.name}_comment`;
      let institution = `${category.name}_${characteristic.name}_institution`;

      this.filename = ''

      for(let x of this.fileDataArray){
        if(x.characteristic === characteristic.name){
          this.filename = x.filename
        }
      }

      if (data[charName]) {
        categoryData.characteristics.push({
          id : characteristic.id,
          name: characteristic.name,
          relevance: data[charRelevance],
          score: data[charScore],
          comment: data[comment],
          filename : this.filename,
          institution : data[institution]
        });
      }
    }
    categoryDataArray.push(categoryData);
  }


  for (let category of this.selectedItems2) {
    let categoryData: any = {
      categoryId :category.id,
      category: category.name,
      characteristics: []
    };

    for (let characteristic of this.getCategory(this.characteristicsList, category.name)) {
      let charName = `${category.name}_${characteristic.name}`;
      let charRelevance = `${category.name}_${characteristic.name}_relevance`;
      let charScore = `${category.name}_${characteristic.name}_score`;
      let comment = `${category.name}_${characteristic.name}_comment`;
      let institution = `${category.name}_${characteristic.name}_institution`;

      this.filename = ''

      for(let x of this.fileDataArray){
        if(x.characteristic === characteristic.name){
          this.filename = x.filename
        }
      }

      if (data[charName]) {
        categoryData.characteristics.push({
          id : characteristic.id,
          name: characteristic.name,
          relevance: data[charRelevance],
          score: data[charScore],
          comment: data[comment],
          filename : this.filename,
          institution : data[institution]
        });
      }
    }
    categoryDataArray.push(categoryData);
  }
}


if( data.policy === 'TC NACAG Initiative'){
  for (let category of this.selectedItems3) {

    this.categoryFilename = ''

    for(let x of this.fileDataArray){
      if(x.characteristic === category.name){
        this.categoryFilename = x.filename
      }
    }

    let categoryData: any = {
      categoryScore: data[`${category.name}_catscore`],
      categoryInstitution : data[`${category.name}_institution`],
      categoryComment : data[`${category.name}_comment`],
      categoryId :category.id,
      category: category.name,
      categoryFile : this.categoryFilename,
      characteristics: []
    };

    for (let characteristic of this.getCategory(this.characteristicsList, category.name)) {
      let charName = `${category.name}_${characteristic.name}`;
      let charRelevance = `${category.name}_${characteristic.name}_relevance`;
      let charScore = `${category.name}_${characteristic.name}_score`;
      let comment = `${category.name}_${characteristic.name}_comment`;
      let institution = `${category.name}_${characteristic.name}_institution`;

      this.filename = ''

      for(let x of this.fileDataArray){
        if(x.characteristic === characteristic.name){
          this.filename = x.filename
        }
      }

      if (data[charName]) {
        categoryData.characteristics.push({
          id : characteristic.id,
          name: characteristic.name,
          relevance: data[charRelevance],
          score: data[charScore],
          comment: data[comment],
          filename : this.filename,
          institution : data[institution]
        });
      }
    }
    categoryDataArray.push(categoryData);
  }


  for (let category of this.selectedItems4) {

    this.categoryFilename = ''

    for(let x of this.fileDataArray){
      if(x.characteristic === category.name){
        this.categoryFilename = x.filename
      }
    }

    let categoryData: any = {
      categoryScore: data[`${category.name}_catscore`],
      categoryInstitution : data[`${category.name}_institution`],
      categoryComment : data[`${category.name}_comment`],
      categoryId :category.id,
      category: category.name,
      categoryFile : this.categoryFilename,
      characteristics: []
    };

    for (let characteristic of this.getCategory(this.characteristicsList, category.name)) {
      let charName = `${category.name}_${characteristic.name}`;
      let charRelevance = `${category.name}_${characteristic.name}_relevance`;
      let charScore = `${category.name}_${characteristic.name}_score`;
      let comment = `${category.name}_${characteristic.name}_comment`;
      let institution = `${category.name}_${characteristic.name}_institution`;

      this.filename = ''

      for(let x of this.fileDataArray){
        if(x.characteristic === characteristic.name){
          this.filename = x.filename
        }
      }

      if (data[charName]) {
        categoryData.characteristics.push({
          id : characteristic.id,
          name: characteristic.name,
          relevance: data[charRelevance],
          score: data[charScore],
          comment: data[comment],
          filename : this.filename,
          institution : data[institution]
        });
      }
    }
    categoryDataArray.push(categoryData);
  }
}
  for(let methdata of this.methListAll){
    if(data.methodology == methdata.methodology_name){
       this.methId = methdata.id
    }

  }

  for(let policydata of this.policyList){
    if(data.policy == policydata.policyName){
       this.policyId = policydata.id;
    }

  }

  for(let barr of this.barrierListobject){
    for(let x of data.selectedBarriers){
      if(x=== barr.barrier){
        this.sendBarriers.push(barr)
      }
    }
  }

  let allData: any = {
    methodology : this.methId,
    categoryData :categoryDataArray,
    policyId : this.policyId,
    tool : 'PORTFOLIO',
    assessment_type : data.assessment_type,
    date1 : data.date1,
    date2 : data.date2,
    assessment_method : data.assessment_method,
    assessment_approach : data.assessment_approach,
    selectedBarriers : this.sendBarriers
  };
   this.methassess.methAssignDataSave(allData).subscribe( res => {


    this.averageProcess = res.result.averageProcess;
    this.averageOutcome = res.result.averageOutcome;
    this.assessmentId = res.assesId;
    this.chart();


   this.methassess.findByAssessIdAndRelevanceNotRelevant(this.assessmentId).subscribe(res => {
      this.relevantChaList = res;
      } )


  } )

  if(data.assessment_approach === 'Direct' && data.assessment_method === 'Track 1'){
    setTimeout(() => {
      this.router.navigate(['/assessment-result',this.assessmentId], { queryParams: { assessmentId: this.assessmentId,
        averageProcess : this.averageProcess , averageOutcome: this.averageOutcome} });
    }, 2000);
  }




}

submitForm(){
  let sendData:any = {
    assessment : this.assessmentId,
    characteristics : this.characAffectedByBarriers
  }

  this.methassess.assessCharacteristicsDataSave(sendData).subscribe(res => {

  } )

  this.trigger = true;
}

filterMethList :any  = []

onIndicatorSelected( indicator: any) {
  this.filterMethList = []

  for(let item of this.methIndicatorsList){
    if(item.indicator.name === indicator){
      this.filterMethList.push(item);
    }
  }


  return this.filterMethList;
}




handleSelectedCharacteristic(event: any) {
  this.filteredIndicatorList = []
  const selectedCharacteristic = event;

  for(let indicator of this.indicatorList){
    if(indicator.characteristics.name === selectedCharacteristic){
      this.filteredIndicatorList.push(indicator)
    }
  }

  return this.filteredIndicatorList

}

uploadedFiles: any[] = [];
showMsg2: boolean = false;
fileDataArray : any =[]
selectedTrack : any
selectedApproach : any

async myUploader(event: any, chaName : any) {


  for (let file of event.files) {

    const formData = new FormData();
    formData.append('file', file);

    let fullUrl =`${this.baseURL}/methodology-assessment/uploadtest`
    this.showMsg2= true;

    this.httpClient.post<any>(fullUrl, formData).subscribe(
      res => {

        let fileData: any = {
          filename : res.location,
          characteristic : chaName
        }

        this.fileDataArray.push(fileData);
        for(let file of event.files) {
          this.uploadedFiles.push(file);
        }
        this.messageService.add({severity: 'info', summary: 'File Uploaded', detail: ''});
      },
      err => {
      }
    );
  }

}

onUpload(event :any) {
  for(let file of event.files) {
      this.uploadedFiles.push(file);
  }

}

onChangeTrack(event : any){
  this.selectedTrack = event.target.value;
}

onChangeApproach(event : any){
  this.selectedApproach = event.target.value;
}


onChangeInstitution(event : any){
}




}
