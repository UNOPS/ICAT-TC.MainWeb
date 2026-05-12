import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Chart } from 'chart.js';
import { Subscription } from 'rxjs';
import { CountryControllerServiceProxy, InvestorToolControllerServiceProxy, ProjectControllerServiceProxy } from 'shared/service-proxies/service-proxies';
import decode from 'jwt-decode';
import { LoginRole } from 'shared/AppService';
import { MasterDataService } from 'app/shared/master-data.service';
import { GuidanceVideoComponent } from 'app/guidance-video/guidance-video.component';
import { DialogService } from 'primeng/dynamicdialog';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  togglemenu: boolean = true;
  innerWidth = 0;

  clickcarbon: boolean = false;
  clickInvest: boolean = false;
  clickpor: boolean = false;
  clickall: boolean = false;

  isInvesmentTool : boolean = false;
  isCarbonMarketTool : boolean = false;
  isPortfolioTool : boolean = false;
  isAllTool : boolean = false;

  indtituteadmin: boolean = false;
  userType: string = "countryAdmin";
  countryAdmin : boolean = false;
  data: any;
  activeprojects=["vv","df","d","d"];
  loading: boolean =false;
  totalRecords: number = 0;
  rows: number = 10;
  last: number;
  event: any;
  chartOptions: any;
  searchBy: any = {
    text: null,
    sector: null,
    NDC: null,
    subNDC: null,
  };
  sectorList: string[] = [];
  subscription: Subscription;
  public i:number = 0;
  public id:string ='chart-container';
  public chartData: Object[];
  public marker: Object;
  public title: string;
  public items:any =[];
  userName: string = "";
  userRole: string = "";
  loginRole = LoginRole;
  typeofInterventionCount: {
    name: string,
    count: number
  }[];

    chart: any = [];
    pieChart:any=[];


  options: any;

  SelectedTool : number;
  

  data1: { labels: string[]; datasets: { label: string; data: number[]; fill: boolean; borderColor: string; }[]; };
  constructor(
    private router: Router,
    private projectProxy: ProjectControllerServiceProxy,
    private countryProxy: CountryControllerServiceProxy,
    public masterDataService: MasterDataService,
    protected dialogService: DialogService,
    private investorProxy: InvestorToolControllerServiceProxy,
  ) {}

  ngOnInit(): void {

    const token = localStorage.getItem('ACCESS_TOKEN')!;
    const tokenPayload = decode<any>(token);
    this.userRole = tokenPayload.role.code;

 

    this.countryProxy.getCountry(tokenPayload.countryId).subscribe((res:any)=>{
      this.isCarbonMarketTool = res.carboneMarketTool;
      this.isInvesmentTool = res.investmentTool;
      this.isPortfolioTool = res.portfoloaTool;   
      if(this.isCarbonMarketTool || this.isInvesmentTool || this.isPortfolioTool ){
        this.isAllTool =true;
      } 

      if(this.userRole !=this.loginRole.External){
        if(this.isCarbonMarketTool){
           this.goToCarbonMarket()
         } else if(this.isInvesmentTool){
           this.goToInvestment();
         } else if (this.isPortfolioTool){
           this.goToPortfolio();
         } else if(this.isAllTool){
          this.goToAllTool();
         }
      }else{
        this.clickcarbon = true;
        this.SelectedTool = 3;
      }
      
        
      
      
    })

    this.projectProxy.findTypeofAction().subscribe((res: any) => {
      this.typeofInterventionCount = res;
      this.loading =true;
      setTimeout(() => {
        this.viewPieChart();
        this.viewbarChart();
      }, 200);
      
      
    });

  }



  goToInvestment(){
    this.clickcarbon = false;
    this.clickInvest = true;
    this.clickpor= false;
    this.clickall=false;

   this.SelectedTool =1;
  }

  goToPortfolio(){
    this.clickcarbon = false;
    this.clickInvest = false;
    this.clickpor= true;
    this.clickall=false;
    this.SelectedTool = 2;
  }

  goToCarbonMarket(){
    this.clickcarbon = true;
    this.clickInvest = false;
    this.clickpor= false;
    this.clickall=false;
    this.SelectedTool = 3;
  }
  goToAllTool(){
    this.clickcarbon = false;
    this.clickInvest = false;
    this.clickpor= false;
    this.clickall=true;
    this.SelectedTool = 4;
  }


  viewbarChart() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');
    const labels = this.typeofInterventionCount.map((item) => item.name);
    const counts: number[] = this.typeofInterventionCount.map((item) => item.count);

    this.data = {
      labels: labels,
      datasets: [
        {
          label: 'Type of Interventions',
          backgroundColor: ['#222b46', '#222b46', '#222b46', '#222b46', '#222b46', '#222b46'],
          data: counts,
        },
      ],
    };

    this.options = {
      indexAxis: 'y',
      maintainAspectRatio: false,
      aspectRatio: 1.1,
      onClick: (event: any, elements: any) => {
        if (elements.length > 0) {
          const clickedIndex = elements[0].index;
          const clickedLabel = labels[clickedIndex];
          const clickedCount = counts[clickedIndex];
  
          this.handleBarClick(clickedLabel, clickedCount);
        }
      },
      plugins: {
        legend: {
          display: false, 
          labels: {
            color: textColor,
          },
        },
        tooltip: {
          callbacks: {
            label: (context: { raw: any; }) => {
              const count = context.raw;
              return `Count: ${count}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
            font: {
              weight: 500,
            },
            stepSize: 1, 
          },
          title: {
            display: true,
            text: 'Number of assessments', 
            color: textColorSecondary,
            font: {
              weight: 'bold',
            },
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false,
          },
        },
        y: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            display: false, 
          },
        },
      },
    };
  }
  handleBarClick(label: string, count: number) {
    if(label=='Carbon market'){
      this.goToCarbonMarket();
    }
    else if(label=='Investment'){
      this.goToInvestment();
    }
    else if(label=='General'){
      this.goToPortfolio();
    }
  
  }
  watchVideo(){
    let ref = this.dialogService.open(GuidanceVideoComponent, {
      header: 'Guidance Video',
      width: '60%',
      contentStyle: {"overflow": "auto"},
      baseZIndex: 10000,
      data: {
        sourceName: 'Overview',
      },
    });

    ref.onClose.subscribe(() => {
      
    })
  }
  
  viewPieChart() {
    this.investorProxy.getDashboardAllDataGraph().subscribe((res:any)=>{
     let  counts= res[0];
      let percentages = res[1];
      this.pieChart = new Chart('pieChart', {
        type: 'doughnut',
        data: {
          datasets: [
            {
              data: res[0],
              backgroundColor:res[1],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
              position:'center',
              labels:{
                boxWidth: 17,
                    boxHeight: 15,
              }
            },
            datalabels: {
              color: '#fff',
              font: {
                size: 12,
              },
              formatter: (value, ctx) => {
                const percentage = percentages[ctx.dataIndex];
                return `${value} (${percentage}%)`;
              },
            },
            
            tooltip: {
              position: 'average',
              boxWidth: 10,
              callbacks: {
                label: (ctx) => {
                  let sum = 0;
                  let array = counts;
                  array.forEach((number: any) => {
                    sum += Number(number);
                  });
                  let percentage = (counts[ctx.dataIndex] ).toFixed(2) + "%";
                  return [
                    `Percentage: ${percentage}`,
                  ];
                },
              },
              backgroundColor: 'rgba(0, 0, 0, 0.8)', 
              titleFont: {
                size: 14,
                weight: 'bold',
              },
              bodyFont: {
                size: 14,
              },
              displayColors: true,
              bodyAlign: 'left',
            },
          },
        },
      });
     })
  }

}
