import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { SocialService } from '../../services/social.service';
import { FlashService, FlashType } from '../../services/flash.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styles: [],
  encapsulation: ViewEncapsulation.None
})
export class RegisterComponent implements OnInit {

  // The user's registration credentials.
  private m_firstName: string = '';
  private m_lastName: string = '';
  private m_emailAddress: string = '';
  private m_password: string = '';
  private m_confirm: string = '';
  private m_working: boolean = false;
  private m_error: string = '';
  private m_errorDetails: string[] = [];

  constructor(
    private routerService: Router,
    private userService: UserService,
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

    // Submit our registration credentials.
    this.userService.registerLocal(
      this.firstName, this.lastName,
      this.emailAddress, this.password, this.confirmedPassword
    ).subscribe(
      (response) => {
        this.flashService.deploy(response['message'], [], FlashType.OK);
        this.routerService.navigate([ '/' ], { replaceUrl: true });
      },

      (error) => {
        const { message, details } = error.error['error'];

        this.m_error = message;
        this.m_errorDetails = details ? details : [];
        this.m_working = false;
      }
    );
  }

  // Getters
  get firstName (): string { return this.m_firstName; }
  get lastName (): string { return this.m_lastName; }
  get emailAddress (): string { return this.m_emailAddress; }
  get password (): string { return this.m_password; }
  get confirmedPassword (): string { return this.m_confirm; }
  get working (): boolean { return this.m_working; }
  get error (): string { return this.m_error; }
  get errorDetails (): string[] { return this.m_errorDetails; }

  // Setters
  set firstName (name: string) { this.m_firstName = name; }
  set lastName (name: string) { this.m_lastName = name; }
  set emailAddress (email: string) { this.m_emailAddress = email; }
  set password (pass: string) { this.m_password = pass; }
  set confirmedPassword (pass: string) { this.m_confirm = pass; }

}
