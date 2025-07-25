import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {  MessageService } from 'primeng/api';
import { Institution, InstitutionCategory, InstitutionCategoryControllerServiceProxy, InstitutionControllerServiceProxy, InstitutionType, InstitutionTypeControllerServiceProxy, Sector, SectorControllerServiceProxy } from 'shared/service-proxies/service-proxies';

@Component({
  selector: 'app-edit-institution',
  templateUrl: './edit-institution.component.html',
  styleUrls: ['./edit-institution.component.css']
})
export class EditInstitutionComponent implements OnInit {

  isSaving: boolean = false;
  institution: Institution = new Institution();
  sectorList: Sector[] = [];
  typeList: InstitutionType[] = [];
  categoryList: InstitutionCategory[] = [];
  institutionId: number = 0;
  Deactivate:string = "Delete";

  rejectComment: string;
  rejectCommentRequried: boolean;
  selectedProject: Institution;
  @ViewChild('op') overlay: any;

  constructor(
    private route: ActivatedRoute,
    private institutionTypeProxy: InstitutionTypeControllerServiceProxy,
    private institutionCatProxy: InstitutionCategoryControllerServiceProxy,
    private router: Router,
    private institutionProxy: InstitutionControllerServiceProxy,
    private messageService: MessageService,
    private sectorProxy:SectorControllerServiceProxy) { }


    OnShowOerlay() {
      this.rejectComment = '';
      this.rejectCommentRequried = false;
    }

  ngOnInit(): void {

    this.institutionTypeProxy
    .getInstitutionType( 0)
    .subscribe((res: any) => {
      this.typeList = res.data;
    });

    this.institutionCatProxy
    .getInstitutionType().subscribe((res: any) => {
      this.categoryList = res;
    });

    this.sectorProxy
    .findAllSector(
     
    ).subscribe((res: any) => {
      this.sectorList = res;
    });

  this.route.queryParams.subscribe((params) => {
    this.institutionId = params['id'];
    this.institutionProxy.getInstitutionById(
      this.institutionId,
    ).subscribe((res) => {      
      this.institution = res;
      this.typeList=[];
      this.typeList.push(res.type)
    })
  })


  }
  saveForm(formData: NgForm) {

     if (formData.valid) {


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

    if (this.institution.id > 0) {
      this.institutionProxy.update(
        this.institution)
        .subscribe(
          (res) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail:
              this.institution.name +
                  ' is updated successfully ' ,
            closable: true,
            
            });
            setTimeout(() => {
              this.onBackClick();    
            },2000);
            
            
          },
          (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error.',
              detail: 'Internal server error, please try again.',
              sticky: true,
            });
          }
        );
        
      
    }}

    else{
      this.messageService.add({
        severity: 'error',
        summary: 'Error.',
        detail: 'Fill all the mandetory fields in correct format',
        sticky: true,
      });
    }
  } 

  


  onConfirm() {
    this.messageService.clear('c');
  }

  onReject() {
    this.messageService.clear('c');
  }

 

  onBackClick() {
    this.router.navigate(['/app/institutionlist']);
  }


} 
