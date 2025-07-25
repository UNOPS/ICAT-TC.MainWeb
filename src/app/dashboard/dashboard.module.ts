import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';

import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { CASADashboardComponent } from './ca-sa-dashboard/ca-sa-dashboard.component';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { RouterModule, Routes } from '@angular/router';

import {
  NbLayoutDirectionService,
  NbMenuModule,
  NbOverlay,
  NbOverlayModule,
  NbOverlayService,
  NbPositionBuilderService,
  NbSidebarModule,
  NbThemeModule,
  NbToastrModule,
  NbToastrService,
  NbLayoutModule,
} from '@nebular/theme';
import { AccordionModule } from 'primeng/accordion';
import { InstitutionComponent } from 'app/institution/add-institution/institution.component';
import { InstitutionListComponent } from 'app/institution/institution-list/institution-list.component';
import { ViewInstitutionComponent } from 'app/institution/view-institution/view-institution.component';
import { ClimateActionComponent } from 'app/climate-action/climate-action/climate-action.component';
import { ViewComponent } from 'app/climate-action/view/view.component';
import { DataRequestComponent } from 'app/data-request-flow/data-request/data-request.component';
import { AssignDataRequestComponent } from 'app/data-request-flow/assign-data-request/assign-data-request.component';
import { ReviewDataComponent } from 'app/data-request-flow/review-data/review-data.component';
import { PortfolioComponent } from 'app/Tool/portfolio/portfolio.component';
import { InvestorComponent } from 'app/Tool/investor/investor.component';
import { AssessmentResultComponent } from 'app/assessment-result/assessment-result.component';
import { ManagedatastatusComponent } from 'app/data-request-flow/managedatastatus/managedatastatus.component';
import { VerificationListComponent } from 'app/verification/verifier/verification-list/verification-list.component';
import { ApproveDataComponent } from 'app/data-request-flow/approve-data/approve-data.component';
import { Assessment } from 'shared/service-proxies/service-proxies';
import { AssessmentComponent } from 'app/assessment/assessment.component';
import { VerificationDetailComponent } from 'app/verification/verifier/verification-detail/verification-detail.component';
import { QualityCheckComponent } from 'app/quality-check/quality-check.component';
import { QualityCheckDetailComponent } from 'app/quality-check-detail/quality-check-detail.component';
import { AssessmentResultTrack2Component } from 'app/assessment-result-track2/assessment-result-track2.component';
import { NonconformanceReportComponent } from 'app/nonconformance-report/nonconformance-report.component';
import { AssignVerifierComponent } from 'app/data-request-flow/assign-verifier/assign-verifier.component';
import { AcceptedPoliciesComponent } from 'app/climate-action/accepted-policies/accepted-policies.component';
import { CarbonMarketAssessmentComponent } from 'app/Tool/carbon-market/carbon-market-assessment/carbon-market-assessment.component';
import { CmResultComponent } from 'app/Tool/carbon-market/cm-result/cm-result.component';
import { AuditComponent } from 'app/audit/audit.component';
import { AuditControllerServiceProxy } from 'shared/service-proxies-auditlog/service-proxies';
import { ReportComponent } from 'app/report/report.component';
import { InvestorToolComponent } from 'app/Tool/investor-tool/investor-tool.component';
import { AssessmentResultInvestorComponent } from 'app/assessment-result-investor/assessment-result-investor.component';
import { EditInstitutionComponent } from 'app/institution/edit-institution/edit-institution.component';
import { InvestmentDashboardComponent } from 'app/investment-dashboard/investment-dashboard.component';
import { ButtonModule } from 'primeng/button';
import { PortfolioDashboardComponent } from 'app/portfolio-dashboard/portfolio-dashboard.component';
import { CarbonMarketDashboardComponent } from 'app/carbon-market-dashboard/carbon-market-dashboard.component';
import { PortfolioListComponent } from 'app/portfolios/portfolio-list/portfolio-list.component';
import { PortfolioAddComponent } from 'app/portfolios/portfolio-add/portfolio-add.component';
import { PortfolioResultComponent } from 'app/portfolios/portfolio-result/portfolio-result.component';
import { EnterDataPathComponent } from 'app/data-request-flow/enter-data-path/enter-data-path/enter-data-path.component';
import { ReviewDataPathComponent } from 'app/data-request-flow/review-data-path/review-data-path/review-data-path.component';
import { PortfolioTrack4Component } from 'app/Tool/portfolio-track4/portfolio-track4.component';
import { PortfolioComparisonComponent } from 'app/portfolios/portfolio-comparison/portfolio-comparison.component';
import { SdgPriorityComponent } from 'app/sdg-priority/sdg-priority.component';
import { AssessmentInprogressComponent } from 'app/assessment-inprogress/assessment-inprogress.component';
import { AssessmentFlowComponent } from 'app/Tool/assessment-flow/assessment-flow.component';
import { RoleGuardService } from 'app/auth/role-guard.service';
import { UserRoles } from '../app-routing.module';


const routes: Routes = [
  {
    path: '',
    component: DashboardComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: 'user',
    loadChildren: () => import('../user/user.module').then((m) => m.UserModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'institutionlist',
    component: InstitutionListComponent,
    canActivate: [RoleGuardService],
    data: {
      expectedRoles: [
        UserRoles.COUNTRY_ADMIN,
        UserRoles.SECTOR_ADMIN,
        UserRoles.MRV_ADMIN,
        UserRoles.DCT,
        UserRoles.TT
      ]
    }
  },
  {
    path: 'add-institution',
    component: InstitutionComponent,
    canActivate: [RoleGuardService],
    data: {
      expectedRoles: [
        UserRoles.COUNTRY_ADMIN,
        UserRoles.SECTOR_ADMIN,
        UserRoles.MRV_ADMIN,
        UserRoles.DCT,
        UserRoles.TT
      ]
    }
  },
  {
    path: 'view-institution',
    component: ViewInstitutionComponent,
    canActivate: [RoleGuardService],
    data: {
      expectedRoles: [
        UserRoles.COUNTRY_ADMIN,
        UserRoles.SECTOR_ADMIN,
        UserRoles.MRV_ADMIN,
        UserRoles.DCT,
        UserRoles.TT
      ]
    }
  },

  {
    path: 'edit-institution',
    component: EditInstitutionComponent,
    canActivate: [RoleGuardService],
    data: {
      expectedRoles: [
        UserRoles.COUNTRY_ADMIN,
        UserRoles.SECTOR_ADMIN,
        UserRoles.MRV_ADMIN,
        UserRoles.DCT,
        UserRoles.TT
      ]
    }
  },
  {
    path: 'add-interventions',
    component: ClimateActionComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'accepted-policies',
    component: AcceptedPoliciesComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'data-request',
    component: DataRequestComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'assign-data-request',
    component: AssignDataRequestComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'enter-data',
    component: EnterDataPathComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'view-data',
    component: ReviewDataPathComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'manage-data',
    component: ManagedatastatusComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'app-approve-data',
    component: ApproveDataComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'view-interventions',
    component: ViewComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'assessment-inprogress',
    component: AssessmentInprogressComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
   {
     path: 'general-tool',
     component: PortfolioTrack4Component,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
     canActivate: [],
     data: {}
   },
  {
    path: 'carbon-market-tool',
    component: CarbonMarketAssessmentComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'carbon-market-tool-edit',
    component: CarbonMarketAssessmentComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'carbon-market-tool-result',
    component: CmResultComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'investor-tool',
    component: InvestorComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
   {
    path: 'audit-log',
    component: AuditComponent,
   loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'investment-tool',
    component: InvestorToolComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'investment-tool-edit',
    component: InvestorToolComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'general-tool-edit',
    component: PortfolioTrack4Component,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'assessment-result/:id',
    component: AssessmentResultComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'verification/list',
    component: VerificationListComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'verification/detail',
    component: VerificationDetailComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'non-conformance',
    component: NonconformanceReportComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'assessment-results',
    component: AssessmentComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'assessment-result-track2/:id',
    component: AssessmentResultTrack2Component,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'assessment-result-investor/:id',
    component: AssessmentResultInvestorComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'quality-controller',
    component: QualityCheckComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'qc/detail',
    component: QualityCheckDetailComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'assign-verifier',
    component: AssignVerifierComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'report',
    component: ReportComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },

  {
    path: 'investment-dashboard',
    component: InvestmentDashboardComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'portfolio-dashboard',
    component: PortfolioDashboardComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'carbon-dashboard',
    component: CarbonMarketDashboardComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'portfolio-list',
    component: PortfolioListComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'portfolio-add',
    component: PortfolioAddComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'portfolio-view',
    component: PortfolioComparisonComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'manage-sdgs',
    component: SdgPriorityComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
  {
    path: 'assessment-flow',
    component: AssessmentFlowComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [],
    data: {}
  },
]

@NgModule({
  declarations: [ CASADashboardComponent],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    ChartModule,
    TableModule,
    ChartModule,
    DropdownModule,
    FormsModule,
    NbLayoutModule,
    AccordionModule,
    ButtonModule
  ]
})
export class DashboardModule { }
