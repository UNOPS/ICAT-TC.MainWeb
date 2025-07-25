import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Institution, InstitutionCategory, InstitutionCategoryControllerServiceProxy, InstitutionControllerServiceProxy, InstitutionType, Sector, User, UsersControllerServiceProxy } from 'shared/service-proxies/service-proxies';
import decode from 'jwt-decode';

@Component({
  selector: 'app-view-institution',
  templateUrl: './view-institution.component.html',
  styleUrls: ['./view-institution.component.css']
})
export class ViewInstitutionComponent implements OnInit {

  userId: number = 0;
  user: User = new User();
  selectedTypeList: InstitutionType[] = [];
  categoryList: InstitutionCategory[] = [];
  institutionId: number = 0;
  title: string;
  institution: Institution = new Institution();

  rejectComment: string;
  rejectCommentRequried: boolean;
  savedInstitution: Institution;
  statusUpdate:number;
  @ViewChild('op') overlay: any;
  userName: string;

  constructor(
    private confirmationService: ConfirmationService,
    private route: ActivatedRoute,
    private institutionProxy: InstitutionControllerServiceProxy,
    private router: Router,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private userProxy: UsersControllerServiceProxy,
    private institutionCatProxy: InstitutionCategoryControllerServiceProxy,
  ) { }


  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }


  OnShowOerlay() {
    this.rejectComment = '';
    this.rejectCommentRequried = false;
  }

  ngOnInit(): void {

    const token = localStorage.getItem('ACCESS_TOKEN')!;
    const currenyUser=decode<any>(token);
    this.userName = currenyUser.username;


    this.userProxy.findUserByUserNameEx(
      this.userName
    ).subscribe((res: any) => {

      this.user = res;

    });

      this.userId = 4;

   

    this.institutionCatProxy
    .getInstitutionType().subscribe((res: any) => {
      this.categoryList = res;
    })

   

    this.route.queryParams.subscribe((params) => {
      this.institutionId = params['id'];
      this.institutionProxy.getInstitutionById(
        this.institutionId,
      ).subscribe((res) => {
        this.institution = res;
      })
    });



    if(this.institutionId == 0){
      this.title = "Add institution"
    }else{
      this.title = "View institution"
    }


    }

    deleteInstitution(institution: Institution){
          this.confirmationService.confirm({
            message: 'Confirm you want to deactivate institution, this action will also deactivate users associated with the institution?',
            accept: () => {
              this.updateStatus(institution);
              this.institutionProxy
              .deactivateInstitution(institution.id)
              .subscribe((res) => {

                this.confirmationService.confirm({

                  accept: () => {

                  }
                })

              })

            },
          });
    }

    updateStatus(institution: Institution){


        let statusUpdate = 1;
        this.institution.status = statusUpdate;


        let sector = new Sector();
        sector.id = this.institution.sector?.id;
        this.institution.sector = sector;


        if (this.institution.type) {
          let type = new InstitutionType();
          type.id = this.institution.type?.id;
          this.institution.type = type;
        }

        if (this.institution.category) {
          let category = new InstitutionCategory();
          category.id = this.institution.category?.id;
          this.institution.category = category;
        }


          this.institutionProxy.update( institution)
          .subscribe((res) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Deactivated successfully',
              detail:
              institution.status === 1
               ? this.institution.name + ' is deactivated' : '',
              closable: true,
            });
          },
          (err) => {
           this.messageService.add({
             severity: 'error',
             summary: 'Error.',
             detail: 'Failed Deactiavted, please try again.',
             sticky: true,
           });
         }
          );

      }

      activateInstitution(institution: Institution){
        if(this.user.institution.id !== institution.id ){

        if(institution.status == 1){
          this.statusUpdate = 0;

        }
        else{
          this.statusUpdate = 1;

        }

      }
      else{
        this.messageService.add({
          severity: 'error',
          summary: 'Error.',
          detail: 'Can not deactivate your own institution',
          sticky: true,
        });
       return 
          
        
      }

        this.institution.status = this.statusUpdate;


        let sector = new Sector();
        sector.id = this.institution.sector?.id;
        this.institution.sector = sector;


        if (this.institution.type) {
          let type = new InstitutionType();
          type.id = this.institution.type?.id;
          this.institution.type = type;
        }

        if (this.institution.category) {
          let category = new InstitutionCategory();
          category.id = this.institution.category?.id;
          this.institution.category = category;
        }

          this.institutionProxy.update(institution)
          .subscribe((res) => {
            this.messageService.add({
              severity: 'success',
              summary: institution.status === 0 ? 'Activated successfully' : 'Deactivated successfully',
              detail:
              institution.status === 0
               ? this.institution.name + ' is activated': this.institution.name + ' is deactivated',
              closable: true,
              
            });
            setTimeout(() => {
              this.onBackClick();    
            },2000)
          },
          (err) => {
           this.messageService.add({
             severity: 'error',
             summary: 'Error.',
             detail: 'Failed Deactiavted, please try again.',
             sticky: true,
           });
         }
          );

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


      onBackClick() {
        this.router.navigate(['/app/institutionlist']);
      }

      edit(institution: Institution){
        this.router.navigate(['app/edit-institution'],{
          queryParams: { id: institution.id}
        });
      }
  }
