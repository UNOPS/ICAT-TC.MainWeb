import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AppService } from 'shared/AppService';
import { AuthControllerServiceProxy, AuthCredentialDto, LoginProfile, LoginProfileControllerServiceProxy,ServiceProxy } from 'shared/service-proxies/auth-service-proxies';
import { User, UsersControllerServiceProxy } from 'shared/service-proxies/service-proxies';

@Component({
  selector: 'app-register-user',
  templateUrl: './register-user.component.html',
  styleUrls: ['./register-user.component.css']
})
export class RegisterUserComponent implements OnInit {
  passwordType: string = "password";
  confirmPasswordType: string = "password";
  isSubmitted: boolean = false;
  fName: string = "";
  lName: string = "";
  email: string = "";
  RegPassword: string = "";
  confirmRegPassword: string = "";
  pwConfirmation: boolean;

  constructor(
    private messageService: MessageService,
    private router: Router,
    private authControllerServiceProxy: AuthControllerServiceProxy,
    private appService: AppService,
    private activatedRoute: ActivatedRoute,
    private userControllerService: UsersControllerServiceProxy,
    private loginprofileControllerServiceProxy: LoginProfileControllerServiceProxy,
    private service:ServiceProxy,
  ) { }

  ngOnInit(): void {
  }

  togglePassword() {
    if (this.passwordType == "text") {
      this.passwordType = "password"
    } else {
      this.passwordType = "text";
    }
  }
  toggleConfirmPassword() {
    if (this.confirmPasswordType == "text") {
      this.confirmPasswordType = "password"
    } else {
      this.confirmPasswordType = "text";
    }
  }
  showPasswordResetForm() {
    this.router.navigate(['../forgot'], { relativeTo: this.activatedRoute });
  }
  async userCreate(form: NgForm) {

    let newUser = new User();

    newUser.email = form.value.email;
    newUser.firstName = form.value.fName;
    newUser.lastName = form.value.lName;

    let newProfile = new LoginProfile();
    newProfile.userName = form.value.email;
    newProfile.coutryId =0;
    newProfile.insId=0;
 
      const b = await this.loginprofileControllerServiceProxy.create(newProfile).subscribe(async (res) => {

        try {
          newUser.loginProfile=res.id;
          newUser.password=res.password;
          newUser.salt=res.salt;
          const a = await this.userControllerService.createExternalUser(newUser).toPromise()
          
        } catch (error) {
        }
        this.messageService.add({
          severity: 'success',
          summary: '',
          detail: 'successfully registered user',
          closable: true,
        });
        setTimeout(() => {
          this.router.navigate(['../confirm-email'], {relativeTo:this.activatedRoute});
        }
        , 2000);
  
      },(err)=>{
        this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Email is existing',
        closable: true,
      });})
    

      
    
  }
  onChange(event: any) {
    this.pwConfirmation = false;
    if (this.RegPassword !== this.confirmRegPassword || this.RegPassword === '' || this.confirmRegPassword === '') {
      this.pwConfirmation = false;

    }
    else {
      this.pwConfirmation = true;
    }

  }


}
