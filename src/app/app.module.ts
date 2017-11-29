import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { TopbarComponent } from './components/topbar/topbar.component';
import { HomeComponent } from './components/home/home.component';
import { RegisterComponent } from './components/register/register.component';
import { SocketService } from './services/socket.service';
import { TokenService } from './services/token.service';
import { FlashService } from './services/flash.service';
import { FlashComponent } from './components/flash/flash.component';
import { UserService } from './services/user.service';
import { SocialService } from './services/social.service';
import { FinishLoginComponent } from './components/finish-login/finish-login.component';
import { LoginComponent } from './components/login/login.component';
import { LocalVerifyComponent } from './components/local-verify/local-verify.component';
import { LogoutComponent } from './components/logout/logout.component';
import { PasswordTokenRequestComponent } from './components/password-token-request/password-token-request.component';
import { PasswordTokenAuthComponent } from './components/password-token-auth/password-token-auth.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { LoginGuard } from './guards/login.guard';
import { NoLoginGuard } from './guards/no-login.guard';
import { DatetimeComponent } from './components/datetime/datetime.component';
import { PollService } from './services/poll.service';
import { PollEditorComponent } from './components/poll-editor/poll-editor.component';
import { PollViewComponent } from './components/poll-view/poll-view.component';
import { PollSearchComponent } from './components/poll-search/poll-search.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: HomeComponent
  },
  {
    path: 'user/register',
    component: RegisterComponent
  },
  {
    path: 'user/verify/:verifyId',
    component: LocalVerifyComponent
  },
  {
    path: 'user/login',
    component: LoginComponent
  },
  {
    path: 'finishlogin',
    component: FinishLoginComponent
  },
  {
    path: 'user/logout',
    component: LogoutComponent  
  },
  {
    path: 'user/issuePasswordToken',
    component: PasswordTokenRequestComponent
  },
  {
    path: 'user/authenticatePasswordToken/:authId',
    component: PasswordTokenAuthComponent
  },
  {
    path: 'user/changePassword/:authId',
    component: ChangePasswordComponent
  },
  {
    path: 'poll/editor',
    canActivate: [LoginGuard],
    component: PollEditorComponent
  },
  {
    path: 'poll/view/:pollId',
    component: PollViewComponent
  },
  {
    path: 'poll/search',
    component: PollSearchComponent
  }
];

@NgModule({
  declarations: [
    AppComponent,
    TopbarComponent,
    HomeComponent,
    RegisterComponent,
    FlashComponent,
    FinishLoginComponent,
    LoginComponent,
    LocalVerifyComponent,
    LogoutComponent,
    PasswordTokenRequestComponent,
    PasswordTokenAuthComponent,
    ChangePasswordComponent,
    DatetimeComponent,
    PollEditorComponent,
    PollViewComponent,
    PollSearchComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot(routes)
  ],
  providers: [SocketService, TokenService, FlashService, UserService, SocialService, LoginGuard, NoLoginGuard, PollService],
  bootstrap: [AppComponent]
})
export class AppModule { }
