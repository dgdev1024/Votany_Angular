import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { FlashService, FlashType } from '../../services/flash.service';

@Component({
  selector: 'app-password-token-request',
  templateUrl: './password-token-request.component.html',
  styles: [],
  encapsulation: ViewEncapsulation.None
})
export class PasswordTokenRequestComponent implements OnInit {

  private m_emailAddress: string = '';
  private m_working: boolean = false;
  private m_error: string = '';
  private m_errorDetails: string[] = [];

  constructor(
    private routerService: Router,
    private userService: UserService,
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

    // Attempt to issue the password token.
    this.userService.issuePasswordToken(
      this.m_emailAddress
    ).subscribe(
      (response) => {
        this.flashService.deploy(response['message'], [], FlashType.OK);
        this.routerService.navigate([ `/user/authenticatePasswordToken/${response['authenticateId']}` ], { replaceUrl: true });
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
  get working (): boolean { return this.m_working; }
  get error (): string { return this.m_error; }
  get errorDetails (): string[] { return this.m_errorDetails; }

  // Setters
  set emailAddress (email: string) { this.m_emailAddress = email; }


}
