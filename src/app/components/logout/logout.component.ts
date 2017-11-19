import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from '../../services/token.service';
import { FlashService, FlashType } from '../../services/flash.service';

@Component({
  selector: 'app-logout',
  template: '',
  styles: [],
  encapsulation: ViewEncapsulation.None
})
export class LogoutComponent implements OnInit {

  constructor(
    private routerService: Router,
    private tokenService: TokenService,
    private flashService: FlashService
  ) { }

  ngOnInit() {
    if (this.tokenService.check() === false) {
      this.flashService.deploy('No login found. Nothing to be done.', [], FlashType.Default);
    } else {
      this.tokenService.clear();
      this.flashService.deploy('You are now logged out.', [], FlashType.OK);
    }

    this.routerService.navigate([ '/' ], { replaceUrl: true });
  }

}
