import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ProfileStatus, RecordStatus } from 'shared/AppService';
import { AuthControllerServiceProxy, ServiceProxy } from 'shared/service-proxies/auth-service-proxies';

@Component({
  selector: 'app-otp',
  templateUrl: './otp.component.html',
  styleUrls: ['./otp.component.css']
})
export class OtpComponent implements OnInit {

  public isSubmitted: boolean=false;
  public otp: number;
  public userName: string;

  constructor(
    private activatedRoute:ActivatedRoute,
    private router: Router,
    private authControllerServiceProxy: AuthControllerServiceProxy,
    private authServiceProxy: ServiceProxy,
    private messageService: MessageService,

  ) { }

  async ngOnInit(): Promise<void> {
    // The OTP page is only reached after a successful forgot-password request,
    // which stores the username in `reset-key`. The account's profileState is
    // enforced server-side by check-otp, so we no longer pre-check it here: that
    // pre-check hit a protected /login-profile endpoint and returned 401 for the
    // unauthenticated user mid-reset, bouncing them back to login before they
    // could submit the OTP.
    const resetKey = localStorage.getItem('reset-key');
    if(resetKey){
      this.userName = resetKey;
    }else{
      this.goLogin();
    }
  }

  toLanding() {
    this.router.navigate(['/landing-page']);
  }
  checkOTP(form: NgForm){
    if(this.userName){
      this.authControllerServiceProxy.submitOTP(this.userName, this.otp).subscribe((res: any )=> {
        if(res.status){
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: res.message,
            closable: true,
          });
          this.goReset();
        }else{
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: res.message,
            closable: true,
          });
        }
      })
    }    
  }

  goReset(){
    this.router.navigate(['../reset'], {relativeTo:this.activatedRoute});
  }

  goLogin(){
    this.router.navigate(['../login'], {relativeTo:this.activatedRoute});
  }

  async getProfileState(userName: string): Promise<number>{
    const profiles = await this.authServiceProxy.getManyBaseLoginProfileControllerLoginProfile(
      ['profileState'],
      undefined,
      [ "status||$ne||"+RecordStatus.Deleted, "userName||$eq||"+userName],
      undefined,
      undefined,
      undefined,
      2,
      0,
      0,
      0
    ).toPromise();
    if(profiles.count > 0){
      return profiles.data[0].profileState;
    }else{
      return -1;
    }
  }

}
