import { Component, OnInit ,ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import decode from 'jwt-decode';
import { AuthControllerServiceProxy, AuthCredentialDto } from 'shared/service-proxies/auth-service-proxies';

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
  setPasswordForm: FormGroup;
  isPasswordType: boolean = true;
  isConfirmPasswordType?: boolean = true;
  passwordConfirm: string = "";
  showEmail: boolean = false;
  public isSubmitted: boolean = false;
  fSetPassword: any;
  

  constructor(
    // private appServiceProxy: AuthControllerServiceProxy,
    private router: Router,
    private authControllerServiceProxy: AuthControllerServiceProxy,
    // private fb: FormBuilder,
    private route: ActivatedRoute
  ) { 
    // this.authenticationService.authenticate(false, true);
    let regEx = new RegExp("^(?=.*[a-z])(?=.*[A-Z])((?=.*[0-9])|(?=.*[!@#$%^&*]))(?=.{6,})");

    // this.form1 = this.fb.group({
    //   // password: ['', [Validators.required]],
    //   password: ['', [Validators.required, Validators.pattern(regEx)]],
    //   confirmPassword: ['', Validators.required],
    // });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = localStorage.getItem('ACCESS_TOKEN')!;
      const tokenPayload = decode<any>(token);
      this.email = tokenPayload.username;
      if (this.email) {
        this.showEmail = true
      }
    });
  }


  clickResetPassword() {
    if (this.form.valid && this.passwordConfirm == this.resetPasswordDto.password) {
      this.resetPasswordDto.username = this.email;
      this.authControllerServiceProxy.resetOWnPassword(this.resetPasswordDto).subscribe(isSuccess => {
        if (isSuccess) {
          this.islSuccessPopup = true;
          this.gotoLogin();
        } else {
          this.isErrorPopup = true;
        }

       
      },
        err => {
          this.isErrorPopup = true;
          console.log(err);

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