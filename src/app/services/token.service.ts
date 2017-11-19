///
/// @file   token.service.ts
/// @brief  The service in charge of managing our login token.
///

import { Injectable } from '@angular/core';
import { Token as LoginToken } from '../interfaces/token';

// The name of the key that will be associated with our login token.
export const LOGIN_TOKEN_KEY: string = '-vot-token';

@Injectable()
export class TokenService {

  get (): LoginToken {
    // Check local storage and see if there is a token.
    const token = localStorage.getItem(LOGIN_TOKEN_KEY);
    if (!token) { 
      return null; 
    }

    // A valid JWT token will have three period-separated segments.
    const segments = token.split('.');
    if (segments.length !== 3) {
      this.clear();
      return null;
    }

    // Exceptions can be thrown in this next part. If one is caught, then
    // clear the token and return null.
    try {
      // The second segment of the token contains our payload. Decode it
      // and parse it as JSON.
      const decoded = JSON.parse(atob(segments[1]));

      // Has the token been decoded? If so, does the token contain a valid
      // user ID, full name, email address, and expiration claim?
      if (!decoded || !decoded._id || !decoded.name || !decoded.exp) {
        this.clear();
        return null;
      }

      // Is the token still fresh? Has it expired?
      if (decoded.exp <= Date.now() / 1000) {
        this.clear();
        return null;
      }

      // Return the decoded login token.
      return {
        id: decoded._id,
        name: decoded.name,
        raw: token
      };
    }
    catch (err) {
      this.clear();
      return null;
    }
  }

  set (raw: string): void {
    localStorage.setItem(LOGIN_TOKEN_KEY, raw);
  }

  check (): boolean {
    return this.get() !== null;
  }

  clear (): void {
    localStorage.clear();
  }

}
