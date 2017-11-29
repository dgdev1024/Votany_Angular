///
/// @file     social.service.ts
/// @brief    The service in charge of social sign-in.

import { Injectable } from '@angular/core';

@Injectable()
export class SocialService {

  constructor() { }

  socialSignin (event, provider: string, returnUrl?: string, queryParams?: string) {
    event.preventDefault();

    if (returnUrl) {
      localStorage.setItem('-vot-return-url', returnUrl);
    }

    if (queryParams) {
      localStorage.setItem('-vot-return-params', queryParams);
    }

    window.location.href = `/api/user/login/${provider}`;
  }

}
