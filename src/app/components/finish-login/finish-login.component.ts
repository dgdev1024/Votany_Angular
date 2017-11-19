import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TokenService } from '../../services/token.service';
import { FlashService, FlashType } from '../../services/flash.service';

@Component({
  selector: 'app-finish-login',
  template: '',
  styles: [],
  encapsulation: ViewEncapsulation.None
})
export class FinishLoginComponent implements OnInit {

  private redirect () {
    this.routerService.navigate([ '/' ], { replaceUrl: true });
  }

  constructor(
    private routerService: Router,
    private activatedRoute: ActivatedRoute,
    private tokenService: TokenService,
    private flashService: FlashService
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe((params) => {
      // Grab the JWT from the query parameter.
      const jwt = params['jwt'];

      // If a JWT was found, then store it in local storage.
      if (jwt) {
        this.tokenService.set(jwt);
      } else {
        this.flashService.deploy('No valid login token found.', [], FlashType.Error);
      }

      // Now redirect the user.
      this.redirect();
    });
  }

}
