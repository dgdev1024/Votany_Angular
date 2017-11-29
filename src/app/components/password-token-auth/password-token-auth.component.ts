import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { FlashService, FlashType } from '../../services/flash.service';

@Component({
  selector: 'app-password-token-auth',
  templateUrl: './password-token-auth.component.html',
  styles: [],
  encapsulation: ViewEncapsulation.None
})
export class PasswordTokenAuthComponent implements OnInit {

  private m_authId: string = '';
  private m_authCode: string = '';
  private m_working: boolean = false;
  private m_error: string = '';
  private m_errorDetails: string[] = [];

  constructor(
    private titleService: Title,
    private routerService: Router,
    private activatedRoute: ActivatedRoute,
    private userService: UserService,
    public flashService: FlashService
  ) { }

  ngOnInit() {
    this.titleService.setTitle('Authenticate a Password Reset - Votany');
    this.activatedRoute.params.subscribe((params) => {
      this.m_authId = params['authId'];
      this.userService.passwordTokenExists(this.m_authId).subscribe(
        (response) => {
          if (response['found'] === true) {
            if (response['spent'] === true) {
              this.flashService.deploy('The password token given is already spent.', [], FlashType.Error);
              this.routerService.navigate([ '/' ], { replaceUrl: true });
            }
            else if (response['authenticated'] === true) {
              this.flashService.deploy('This password token has already been authenticated.', [], FlashType.Error);
              this.routerService.navigate([ '/' ], { replaceUrl: true });
            }
          } else {
            this.flashService.deploy('A password token with the given ID was not found.', [], FlashType.Error);
            this.routerService.navigate([ '/' ], { replaceUrl: true });
          }
        },

        (error) => {
          const { message } = error.error['error'];
          this.flashService.deploy(message, [], FlashType.Error);
          this.routerService.navigate([ '/' ], { replaceUrl: true });
        }
      );
    });
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
    this.userService.authenticatePasswordToken(
      this.m_authId, this.m_authCode
    ).subscribe(
      (response) => {
        this.flashService.deploy(response['message'], [], FlashType.OK);
        this.routerService.navigate([ `/user/changePassword/${this.m_authId}` ], { replaceUrl: true });
      },

      (error) => {
        const { message } = error.error['error'];
        
        this.m_error = message;
        this.m_working = false;
      }
    );
  }

  // Getters
  get authCode (): string { return this.m_authCode; }
  get working (): boolean { return this.m_working; }
  get error (): string { return this.m_error; }
  get errorDetails (): string[] { return this.m_errorDetails; }

  // Setters
  set authCode (code: string) { this.m_authCode = code; }


}
