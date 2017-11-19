///
/// @file     social.service.ts
/// @brief    The service in charge of social sign-in.

import { Injectable } from '@angular/core';

@Injectable()
export class SocialService {

  constructor() { }

  socialSignin (event, provider: string) {
    event.preventDefault();
    window.location.href = `/api/user/login/${provider}`;
  }

}
