///
/// @file   user.service.ts
/// @brief  The service in charge of managing the logged-in user.
///

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class UserService {

  constructor(private httpService: HttpClient) { }

  registerLocal (
    firstName: string,
    lastName: string,
    emailAddress: string,
    password: string,
    confirm: string
  ) {
    return this.httpService.post('/api/user/register', {
      firstName, lastName, emailAddress, password, confirm
    });
  }

  verifyLocal (verifyId: string) {
    return this.httpService.get(`/api/user/verify/${verifyId}`);
  }

  attemptLocalLogin (emailAddress: string, password: string) {
    return this.httpService.post('/api/user/login/local', { emailAddress, password });
  }

  issuePasswordToken (emailAddress: string) {
    return this.httpService.post('/api/user/issuePasswordToken', { emailAddress });
  }

  authenticatePasswordToken (id: string, code: string) {
    return this.httpService.post(`/api/user/authenticatePasswordToken/${id}`, { 
      authenticateCode: code
    });
  }

  changePassword (id: string, password: string, confirm: string) {
    return this.httpService.post(`/api/user/changePassword/${id}`, {
      password, confirm
    });
  }

  fetchUserProfile (userId: string) {
    return this.httpService.get(`/api/user/profile/${userId}`);
  }

}
