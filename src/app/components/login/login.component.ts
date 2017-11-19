import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { TokenService } from '../../services/token.service';
import { SocialService } from '../../services/social.service';
import { FlashService, FlashType } from '../../services/flash.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styles: [],
  encapsulation: ViewEncapsulation.None
})
export class LoginComponent implements OnInit {

  private m_emailAddress: string = '';
  private m_password: string = '';
  private m_working: boolean = false;
  private m_error: string = '';
  private m_errorDetails: string[] = [];

  constructor(
    private routerService: Router,
    private userService: UserService,
    private tokenService: TokenService,
    public socialService: SocialService,
    public flashService: FlashService
  ) { }

  ngOnInit() {
    
  }

  ///
  /// @fn     onSubmitClicked
  /// @brief  Fired when the submit button is clicked.
  ///
  onSubmitClicked (event) {
    // Prevent normal submit behavior.
    event.preventDefault();

    // Turn on the working flag.
    this.m_working = true;

    // Attempt to log in.
    this.userService.attemptLocalLogin(
      this.m_emailAddress, this.m_password
    ).subscribe(
      (response) => {
        this.tokenService.set(response['token']);
        this.routerService.navigate([ '/' ], { replaceUrl: true });
      },

      (error) => {
        const { message } = error.error['error'];
        
        this.m_error = message;
        this.m_working = false;
      }
    );
  }

  // Getters
  get emailAddress (): string { return this.m_emailAddress; }
  get password (): string { return this.m_password; }
  get working (): boolean { return this.m_working; }
  get error (): string { return this.m_error; }
  get errorDetails (): string[] { return this.m_errorDetails; }

  // Setters
  set emailAddress (email: string) { this.m_emailAddress = email; }
  set password (pass: string) { this.m_password = pass; }


}
