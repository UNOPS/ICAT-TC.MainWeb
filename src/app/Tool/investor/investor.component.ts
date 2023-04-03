import { IDropdownSettings } from 'ng-multiselect-dropdown';
//import { MethodologyControllerServiceProxy } from 'shared/service-proxies/meth-service-proxies';
import { Institution, InstitutionControllerServiceProxy, MethodologyAssessmentControllerServiceProxy, ProjectControllerServiceProxy, ServiceProxy } from 'shared/service-proxies/service-proxies';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {  Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {Chart} from 'chart.js';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { environment } from 'environments/environment';
import decode from 'jwt-decode';

interface CategoryInput {
  id: number;
  category: string;
  characteristics: {
    name: string;
    relevance: string;
    score: number;
  }[];
}



@Component({
  selector: 'app-investor',
  templateUrl: './investor.component.html',
  styleUrls: ['./investor.component.css']
})

export class InvestorComponent implements OnInit {

  private apiUrl = 'http://localhost:7100/methodology/assessmentData';

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
    private instituionProxy: InstitutionControllerServiceProxy,
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
//Processess of change
  dropdownList: { item_id: number, item_text: string }[] = [];
 // selectedItems: { id: number, name: string }[] = [];
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
 /*  categories = [
    {name: 'Category 1', characteristics: [
      {name: 'Characteristic 1', score: 0, relevance: '', selected:''},
      {name: 'Characteristic 2', score: 0, relevance: '', selected:''},
      {name: 'Characteristic 3', score: 0, relevance: '', selected:''}
    ]},
    {name: 'Category 2', characteristics: [
      {name: 'Characteristic 4', score: 0, relevance: '', selected:''},
      {name: 'Characteristic 5', score: 0, relevance: '', selected:''},
      {name: 'Characteristic 6', score: 0, relevance: '', selected:''}
    ]},
    {name: 'Category 3', characteristics: [
      {name: 'Characteristic 7', score: 0, relevance: '', selected:''},
      {name: 'Characteristic 8', score: 0, relevance: '', selected:''},
      {name: 'Characteristic 9', score: 0, relevance: '', selected:''}
    ]},
    {name: 'Category 4', characteristics: [
      {name: 'Characteristic 10', score: 0, relevance: '', selected:''},
      {name: 'Characteristic 11', score: 0, relevance: '', selected:''},
      {name: 'Characteristic 12', score: 0, relevance: '', selected:''}
    ]}
  ];
 */

  characteristics :any = [];

  selectedCategories: string[] = ['Category 1', 'Category 2'];


/*   showSelectedItems() {
    console.log("aaa",this.categories);
  }
   */



  chart(): void {
    if (!this.canvasRef) {
      console.error('Could not find canvas element');
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Could not get canvas context');
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

    this.instituionProxy.getInstituion(3,this.userCountryId,1000,0).subscribe((res: any) => {
      this.instiTutionList = res;
      console.log( "listtt",this.instiTutionList)
    });


  this.methassess.findAllBarriers().subscribe((res: any) => {
      console.log("barrierss : ", res)
      this.barrierListobject = res
      for(let x of res){
        this.barriersList.push(x.barrier)
      }
      console.log("barriersList : ", this.barriersList)

    });

    this.methassess.findAllPolicyBarriers().subscribe((res: any) => {
      console.log("policybarrierssList : ", res)
      this.policyBarriersList = res


    });




    this.methassess.findAllIndicators().subscribe((res: any) => {
      console.log("indicators : ", res)
      this.indicatorList = res
   /*    this.barriersList = res
      console.log("barriersList : ", this.barriersList) */

    });


    this.climateAction.findAllPolicies().subscribe((res: any) => {
      console.log("policyList : ", res)
      for(let data of res){
        let policyObj = {
          id : data.id,
          policyName : data.policyName
        }

        this.policyList.push(policyObj)
      }

      console.log("policyList : ", this.policyList)

    });

    this.methList = [];
    this.methListAll = [];
    this.characteristicsList = [];
    this.methassess.findAllMethodologies().subscribe((res: any) => {
      console.log("ressss", res)
      for (let x of res) {
        this.methList.push(x.methodology_name);
        this.methListAll.push(x);
      }

      console.log("policyList222 : ", this.policyList)
    });



    this.categotyList = [];
    this.meth1Process = [];
    this.meth1Outcomes = [];
    this.methassess.findAllCategories().subscribe((res2: any) => {
      console.log("categoryList", res2)
      for (let x of res2) {
        //this.categotyList.push(x);
          if(x.type === 'process'){
            this.meth1Process.push(x)
          }
          if(x.type === 'outcome'){
            this.meth1Outcomes.push(x)
          }
      }
      console.log("yyyy",this.meth1Process )
    });

    this.methassess.findAllCharacteristics().subscribe((res3: any) => {
      console.log("ressss3333", res3)
      this.characteristicsList = res3

    });

   // console.log("categotyList", this.categotyList)
   this.methassess.findAllMethIndicators().subscribe((res: any) => {
    console.log("ressssponseee", res)
    this.methIndicatorsList = res
   // this.characteristicsList = res

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




     // Initialize the list of characteristics based on the selected category
    /*  this.updateCharacteristics(); */
  }

/*   onSubmit(data:any){
    console.log("dataaaa", data)


    this.methassess.methAssignDataSave(data).subscribe(res => {
      console.log("saved data",res)
    } )
  }
 */

  flag : boolean = false

   onChange(event:any) {

    this.flag = false
   //this.onChange2(event)
    this.selectedType = event.target.value;
    this.selectedPolicyBarriersList = []

     for(let x of this.policyBarriersList){
        if(x.policyName === this.selectedType){
          for(let barriersss of this.barriersList){
              if(x.barriers.barrier === barriersss)

            this.selectedPolicyBarriersList.push(barriersss)
          }

        }
    }
    console.log("selectedPolicyBarriersList: ", this.selectedPolicyBarriersList)

    setTimeout(() => {
      this.flag = true;
    }, 500);
  }


  /* async onChange2(event:any) {


    this.selectedType = event.target.value;
    this.selectedPolicyBarriersList = []

     for(let x of this.policyBarriersList){
        if(x.policyName === this.selectedType){
          for(let barriersss of this.barriersList){
              if(x.barriers.barrier === barriersss)

            this.selectedPolicyBarriersList.push(barriersss)
          }

        }
    }
    console.log("selectedPolicyBarriersList: ", this.selectedPolicyBarriersList)
  } */


  // Update the list of characteristics based on the selected category
/*   updateCharacteristics() {
    const selectedCategoryNames = new Set(this.selectedCategories);
    this.characteristics = this.categories
      .filter(category => selectedCategoryNames.has(category.name))
      .flatMap(category => category.characteristics);
  } */




  getCategory(characteristics: any, category: any) {

    /* const foundCategory = this.categories.find(c => c.name === category);
    console.log("chaaaa",foundCategory ? foundCategory.characteristics : [])
    return foundCategory ? foundCategory.characteristics : [];  */
    this.characteristicsArray = [];
    for (let x of this.characteristicsList) {
      if (x.category.name === category) {
        this.characteristicsArray.push(x)
      }
    }

   // console.log("cha", this,this.characteristicsArray)
    return this.characteristicsArray

  }


//Processess of change
onItemSelect(item: any) {
  console.log("aaa1",item);
  this.selectedItems = [];
  for(let x of item.value){
    this.selectedItems.push(x)
  }

  console.log("select11", this.selectedItems);

}

onItemSelectBarriers(item: any){
  console.log("bbbbb",item);
  this.selectedPolicyBarriersList = [];
  for(let x of item.value){
    this.selectedPolicyBarriersList.push(x)
  }

  console.log("policyBarriersList99999999", this.selectedPolicyBarriersList);

}
/* onSelectAll(items: any) {
  this.selectedItems = [];
  for(let x of items){
    this.selectedItems.push(x)
  }
  console.log(items);
}

 onItemDeSelect(item: any) {
  const index = this.selectedItems.findIndex((selectedItem) => selectedItem.id === item.item_id);
  this.selectedItems.splice(index, 1);
}


onDeSelectAll(item: any){
  this.selectedItems = [];
} */



//Outcomes of change
onItemSelect2(item: any) {
  console.log("aaa2",item);
  this.selectedItems2 = [];
  for(let x of item.value){
    this.selectedItems2.push(x)
  }

  console.log("select22", this.selectedItems2);
}

/* onSelectAll2(items: any) {
  this.selectedItems2 = [];
  for(let x of items){
    this.selectedItems2.push(x)
  }
  console.log(items);
}

 onItemDeSelect2(item: any) {
  const index = this.selectedItems2.findIndex((selectedItem2) => selectedItem2.id === item.item_id);
  this.selectedItems2.splice(index, 1);
}

onDeSelectAll2(item: any){
  this.selectedItems2 = [];
} */


onItemSelect3(item: any) {
  console.log("aaa",item);
  this.selectedItems3 = [];
  for(let x of item.value){
    this.selectedItems3.push(x)
  }

  console.log("select3", this.selectedItems3);
}


/* onSelectAll3(items: any) {
  this.selectedItems3 = [];
  for(let x of items){
    this.selectedItems3.push(x)
  }
  console.log(items);
}

 onItemDeSelect3(item: any) {
  const index = this.selectedItems3.findIndex((selectedItem3) => selectedItem3.id === item.item_id);
  this.selectedItems3.splice(index, 1);
}


onDeSelectAll3(item: any){
  this.selectedItems3 = [];
} */


onItemSelect4(item: any) {
  console.log("aaa",item);
  this.selectedItems4 = [];
  for(let x of item.value){
    this.selectedItems4.push(x)
  }

  console.log("select4", this.selectedItems4);

}

onItemSelectcha(item :any){
  console.log("aaa333",item);
  this.selectChaAffectByBarriers = [];
  for(let x of item.value){
    this.selectChaAffectByBarriers.push(x)
  }

  console.log("select", this.selectChaAffectByBarriers);

}

/* onSelectAll4(items: any) {
  this.selectedItems4 = [];
  for(let x of items){
    this.selectedItems4.push(x)
  }
  console.log(items);
}

 onItemDeSelect4(item: any) {
  const index = this.selectedItems4.findIndex((selectedItem4) => selectedItem4.id === item.item_id);
  this.selectedItems4.splice(index, 1);
}


onDeSelectAll4(item: any){
  this.selectedItems4 = [];
} */


/* //////////////////////////////// */

onItemSelect6(item: any) {
  console.log("aaa",item);
  this.selectedBarriers = [];
  for(let x of item.value){
    this.selectedBarriers.push(x)
  }
  console.log("select77", this.selectedBarriers);

}
/* onSelectAll6(items: any) {
  this.selectedBarriers = [];
  for(let x of items){
    this.selectedBarriers.push(x)
  }
  console.log("select6", this.selectedBarriers);
}

 onItemDeSelect6(item: any) {
  const index = this.selectedBarriers.findIndex((selectedBarriers) => selectedBarriers.id === item.id);
  this.selectedBarriers.splice(index, 1);

  console.log("select6", this.selectedBarriers);
}

onDeSelectAll6(item: any){
  this.selectedBarriers = [];

  console.log("select6", this.selectedBarriers);
} */


onItemSelect7(item: any) {
/*   console.log(item);
  this.characAffectedByBarriers.push(item)
  console.log("select7", this.characAffectedByBarriers); */
  console.log("aaa",item);
  this.characAffectedByBarriers = [];
  for(let x of item.value){
    this.characAffectedByBarriers.push(x)
  }
  console.log("select77", this.characAffectedByBarriers);

}
/* onSelectAll7(items: any) {
  this.characAffectedByBarriers = [];
  for(let x of items){
    this.characAffectedByBarriers.push(x)
  }
  console.log("select7", this.characAffectedByBarriers);
}

 onItemDeSelect7(item: any) {
  const index = this.characAffectedByBarriers.findIndex((characAffectedByBarriers) => characAffectedByBarriers.id === item.id);
  this.characAffectedByBarriers.splice(index, 1);

  console.log("select7", this.characAffectedByBarriers);
}

onDeSelectAll7(item: any){
  this.characAffectedByBarriers = [];

  console.log("select7", this.characAffectedByBarriers);
} */


 onSubmit(data: any) {
  this.isSubmitted = false;
  this.assessmentId = 0;
  if(data.assessment_approach === 'Indirect' && data.assessment_method === 'Track 1'){
  this.isSubmitted = true;
  }

  console.log("ddd: ", data)
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
    console.log("kkk",categoryData);
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
    console.log("kkk",categoryData);
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
    console.log("kkk",categoryData);
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
    console.log("kkk",categoryData);
    categoryDataArray.push(categoryData);
  }
}
  console.log("data",data)

  //pppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppp

  for(let methdata of this.methListAll){
    console.log("methdata",methdata)
    if(data.methodology == methdata.methodology_name){
       this.methId = methdata.id
    }

  }

  for(let policydata of this.policyList){
    console.log("policydata",policydata)
    if(data.policy == policydata.policyName){
       this.policyId = policydata.id
    }

  }

  for(let barr of this.barrierListobject){
    for(let x of data.selectedBarriers){
      if(x=== barr.barrier){
        this.sendBarriers.push(barr)
      }
    }
  }


  console.log("policy Selected Id : ", this.policyId)

console.log("methiddd,", this.methId)
  let allData: any = {
    methodology : this.methId,
    categoryData :categoryDataArray,
    policyId : this.policyId,
    tool : 'Investor & Private Sector Tool',
    assessment_type : data.assessment_type,
    date1 : data.date1,
    date2 : data.date2,
    assessment_method : data.assessment_method,
    assessment_approach : data.assessment_approach,
    selectedBarriers : this.sendBarriers
   // barriers : this.selectedBarriers
  };
  console.log("final array",allData);

  // Send categoryDataArray to backend here

   this.methassess.methAssignDataSave(allData).subscribe( res => {


    this.averageProcess = res.result.averageProcess
    this.averageOutcome = res.result.averageOutcome
    this.assessmentId = res.assesId

    console.log("averageProcess1 : ", this.averageProcess)
    console.log("averageOutcome1 : ", this.averageOutcome)
    console.log("assessId : ", this.assessmentId)
    this.chart();


   this.methassess.findByAssessIdAndRelevanceNotRelevant(this.assessmentId).subscribe(res => {
      console.log("chaaaaaa2",res )
      this.relevantChaList = res
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
    console.log("savetttt data",res)

  } )

  this.trigger = true

  console.log("senddddd", sendData)
}

filterMethList :any  = []

onIndicatorSelected( indicator: any) {
  console.log('Selected indicator for22233:', indicator);
  this.filterMethList = []

  for(let item of this.methIndicatorsList){
    if(item.indicator.name === indicator){
      this.filterMethList.push(item)
    }
  }

  console.log("sl indii2222: ", this.filterMethList)

  return this.filterMethList
}




handleSelectedCharacteristic(event: any) {
  this.filteredIndicatorList = []
  const selectedCharacteristic = event;
  // Do something with the selected characteristic
  console.log(selectedCharacteristic);

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

  console.log("chaaNamee", chaName)

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

        this.fileDataArray.push(fileData)
        console.log("nameeee", fileData);
        console.log("fileDataArray", this.fileDataArray);
        for(let file of event.files) {
          this.uploadedFiles.push(file);
        }
        this.messageService.add({severity: 'info', summary: 'File Uploaded', detail: ''});
      },
      err => {
        console.log(err);
      }
    );
  }

}

onUpload(event :any) {
  for(let file of event.files) {
      this.uploadedFiles.push(file);
  }
      console.log("hello")

}

onChangeTrack(event : any){
  this.selectedTrack = event.target.value;
  console.log("selectedTrack : ", this.selectedTrack)
}

onChangeApproach(event : any){
  this.selectedApproach = event.target.value;
  console.log("selectedApproach : ", this.selectedApproach)
}


onChangeInstitution(event : any){
  console.log("selectedInstitution: ", event.target.value)
}




}