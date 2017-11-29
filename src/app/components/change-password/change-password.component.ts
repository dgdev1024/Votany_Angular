import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { FlashService, FlashType } from '../../services/flash.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styles: [],
  encapsulation: ViewEncapsulation.None
})
export class ChangePasswordComponent implements OnInit {

  private m_authId: string = '';
  private m_password: string = '';
  private m_confirm: string = '';
  private m_working: boolean = false;
  private m_error: string = '';
  private m_errorDetails: string[] = [];

  constructor(
    private routerService: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
    private userService: UserService,
    public flashService: FlashService
  ) { }

  ngOnInit() {
    this.titleService.setTitle('Change Your Password - Votany');
    this.activatedRoute.params.subscribe((params) => {
      this.m_authId = params['authId'];
      this.userService.passwordTokenExists(this.m_authId).subscribe(
        (response) => {
          if (response['found'] === true) {
            if (response['spent'] === true) {
              this.flashService.deploy('The password token given is already spent.', [], FlashType.Error);
              this.routerService.navigate([ '/' ], { replaceUrl: true });
            }
            else if (response['authenticated'] === false) {
              this.flashService.deploy('This password token has not been authenticated.', [], FlashType.Error);
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

    // Submit our registration credentials.
    this.userService.changePassword(
      this.m_authId, this.m_password, this.m_confirm
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
  get password (): string { return this.m_password; }
  get confirmedPassword (): string { return this.m_confirm; }
  get working (): boolean { return this.m_working; }
  get error (): string { return this.m_error; }
  get errorDetails (): string[] { return this.m_errorDetails; }

  // Setters
  set password (pass: string) { this.m_password = pass; }
  set confirmedPassword (pass: string) { this.m_confirm = pass; }

}
