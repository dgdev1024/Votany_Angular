import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

@Injectable()
export class LoginGuard implements CanActivate {
  constructor (
    private routerService: Router,
    private tokenService: TokenService
  ) {}

  canActivate (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.tokenService.check() === false) {
      this.routerService.navigate([ '/user/login' ], { 
        queryParams: { 
          ...next.queryParams,
          returnUrl: state.url.split('?')[0]
        }
      });

      return false;
    }
    return true;
  }
}
