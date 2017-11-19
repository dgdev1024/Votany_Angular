import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { FlashService, FlashType } from '../../services/flash.service';

@Component({
  selector: 'app-local-verify',
  template: '',
  styles: [],
  encapsulation: ViewEncapsulation.None
})
export class LocalVerifyComponent implements OnInit {

  constructor(
    private routerService: Router,
    private activatedRoute: ActivatedRoute,
    private userService: UserService,
    private flashService: FlashService
  ) { }

  ngOnInit() {
    // Grab the verification ID from the route's parameters.
    this.activatedRoute.params.subscribe((params) => {
      // Attempt to verify the account with that ID.
      this.userService.verifyLocal(params['verifyId']).subscribe(
        // #RIPMalcomYoung
        (response) => {
          this.flashService.deploy(response['message'], [], FlashType.OK);
          this.routerService.navigate([ '/' ], { replaceUrl: true });
        },

        (error) => {
          const { message } = error.error['error'];

          this.flashService.deploy(message, [], FlashType.Error);
          this.routerService.navigate([ '/' ], { replaceUrl: true });
        }
      );
    });
  }

}
