import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, UntypedFormGroup, NgForm, Validators } from '@angular/forms';
import decode from 'jwt-decode';
import { AuthControllerServiceProxy, AuthCredentialDto } from 'shared/service-proxies/auth-service-proxies';
import { GuidanceVideoComponent } from 'app/guidance-video/guidance-video.component';
import { DialogService } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-set-password',
  templateUrl: './set-password.component.html',
  styleUrls: ['./set-password.component.css']
})
export class SetPasswordComponent implements OnInit {

  @ViewChild('fSetPassword') form: NgForm;
  showLoginForm = false;
  showForgotPassword = false;
  showSetPassword = true;
  restToken: string;
  email: string = "";
  resetPasswordDto = new AuthCredentialDto;
  islSuccessPopup: boolean;
  isErrorPopup: boolean;
  setPasswordForm: UntypedFormGroup;
  isPasswordType: boolean = true;
  isConfirmPasswordType?: boolean = true;
  passwordConfirm: string = "";
  showEmail: boolean = false;
  public isSubmitted: boolean = false;
  fSetPassword: any;


  constructor(
    private router: Router,
    private authControllerServiceProxy: AuthControllerServiceProxy,
    private route: ActivatedRoute,
    protected dialogService: DialogService,
    private messageService: MessageService,
  ) {
    let regEx = new RegExp("^(?=.*[a-z])(?=.*[A-Z])((?=.*[0-9])|(?=.*[!@#$%^&*]))(?=.{6,})");

  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.email = params['email'];
        this.showEmail = false;
        return;
      }
      try {
        const tokenPayload = decode<any>(localStorage.getItem('ACCESS_TOKEN')!);
        this.email = tokenPayload.username;
      } catch {
        this.email = '';
      }
      this.showEmail = !!this.email;
    });
  }

  watchVideo() {
    let ref = this.dialogService.open(GuidanceVideoComponent, {
      header: 'Guidance Video',
      width: '60%',
      contentStyle: { "overflow": "auto" },
      baseZIndex: 10000,
      data: {
        sourceName: 'Reports',
      },
    });

    ref.onClose.subscribe(() => {

    })
  }

  clickResetPassword() {
    if (this.form.valid && this.passwordConfirm == this.resetPasswordDto.password) {
      this.resetPasswordDto.username = this.email.trim();
      this.authControllerServiceProxy.resetOWnPassword(this.resetPasswordDto).subscribe(res => {
        if (res?.status) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Your password has been set. Please log in.', closable: true });
          this.gotoLogin();
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'The email or code is not correct. Please check the latest email you received.', closable: true });
        }
      },
        err => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not set the password. Please try again later.', closable: true });
        });
    }
  }

  get password() {
    return this.setPasswordForm.get('password');
  }

  get confirmPassword() {
    return this.setPasswordForm.get('confirmPassword');
  }

  gotoLogin() {
    this.router.navigate(['/auth/login']);
  }

  togglePasswordText() {
    this.isPasswordType = !this.isPasswordType;
  }

  toggleConfirmPasswordText() {
    this.isConfirmPasswordType = !this.isConfirmPasswordType;
  }

  toLanding() {
    this.router.navigate(['/landing-page'])
  }
}
