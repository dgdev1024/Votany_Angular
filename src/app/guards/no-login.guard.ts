import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

@Injectable()
export class NoLoginGuard implements CanActivate {
  constructor (
    private routerService: Router,
    private tokenService: TokenService
  ) {}

  canActivate (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.tokenService.check() === true) {
      this.routerService.navigate([ '/user/dashboard' ], { queryParams: { returnUrl: state.url }});
      return false;
    }
    return true;
  }
}
