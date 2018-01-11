import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { PollService } from '../../services/poll.service';
import { TokenService } from '../../services/token.service';
import { SocketService } from '../../services/socket.service';
import { FlashService, FlashType } from '../../services/flash.service';
import { User } from '../../interfaces/user';
import { PollSearchResult } from '../../interfaces/poll';
import * as moment from 'moment';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styles: [],
  encapsulation: ViewEncapsulation.None
})
export class ProfileComponent implements OnInit {

  // User Variables
  private m_userId: string = '';
  private m_userFetching: boolean = false;
  private m_userError: string = '';
  private m_userResult: User = null;

  // Poll Variables
  private m_pollPage: number = 0;
  private m_pollFetching: boolean = false;
  private m_pollError: string = '';
  private m_pollResult: PollSearchResult[] = [];
  private m_pollLastPage: boolean = true;
  
  private initializeEvents () {
    this.socketService.on('cast vote', (data) => {
      for (let result of this.m_pollResult) {
        if (result.pollId === data['pollId']) {
          result.voteCount++;
        }
      }
    });

    this.socketService.on('post comment', (data) => {
      for (let result of this.m_pollResult) {
        if (result.pollId === data['pollId']) {
          result.commentCount++;
        }
      }
    });
    
    this.socketService.on('remove comment', (data) => {
      for (let result of this.m_pollResult) {
        if (result.pollId === data['pollId']) {
          result.commentCount--;
        }
      }
    });
  }

  private fetchPolls (page: number = 0) {
    this.m_pollError = '';
    this.m_pollPage = page;
    this.m_pollFetching = true;

    this.pollService.searchPollsByUser(this.m_userId, this.m_pollPage).subscribe(
      (response) => {
        this.m_pollResult = response['polls'];
        this.m_pollLastPage = response['lastPage'];
        for (let result of this.m_pollResult) {
          result.postDateStr = moment(result.postDate).format('MMMM Do YYYY');
        }
        this.m_pollFetching = false;
        this.locationService.replaceState(
          `/user/profile/${this.m_userId}`,
          `pollPage=${this.m_pollPage}`
        );
      },

      (error) => {
        const { message } = error.error['error'];
        this.m_pollError = message;
        this.m_pollFetching = false;
      }
    );
  }

  private fetchProfile () {
    this.m_userError = '';
    this.m_userFetching = true;

    this.userService.fetchUserProfile(this.m_userId).subscribe(
      (response: User) => {
        this.m_userResult = response;
        this.m_userResult.joinDateStr = moment(this.m_userResult.joinDate).format('MMMM Do YYYY');
        this.m_userFetching = false;
        this.titleService.setTitle(`${this.m_userResult.name}'s Profile - Votany`);
      },

      (error) => {
        const { message } = error.error['error'];
        this.m_userError = message;
        this.m_userFetching = false;
      }
    );
  }

  constructor(
    private routerService: Router,
    private activatedRoute: ActivatedRoute,
    private locationService: Location,
    private titleService: Title,
    private userService: UserService,
    private pollService: PollService,
    public tokenService: TokenService,
    private socketService: SocketService,
    public flashService: FlashService
  ) { }

  ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      this.m_userId = params['userId'];
      this.activatedRoute.queryParams.subscribe((params) => {
        this.m_pollPage = parseInt(params['pollPage']) || 0;
        this.fetchProfile();
        this.fetchPolls(this.m_pollPage);
      });
    });
  }

  ngOnDestroy () {
    this.socketService.clear();
  }
  
  onPreviousClicked () {
    if (this.m_pollPage > 0) { this.fetchPolls(this.m_pollPage - 1); }
  }

  onNextClicked () {
    if (this.m_pollLastPage === false) { this.fetchPolls(this.m_pollPage + 1); }
  }

  deleteUser (ev) {
    ev.preventDefault();
    const aysOne = confirm('Are you sure you want to delete your Votany account?');
    if (aysOne === false) { return; }

    const aysTwo = confirm('This will delete ALL of your polls and comments! Are you ABSOLUTELY sure?');
    if (aysTwo === false) { return; }

    this.userService.deleteUser(this.m_userId).subscribe(
      (response) => {
        this.tokenService.clear();
        this.flashService.deploy('Your account has been deleted.', [], FlashType.OK);
        this.routerService.navigate([ '/' ], { replaceUrl: true });
      },

      (error) => {
        const { message } = error.error['error'];
        this.flashService.deploy(message, [], FlashType.Error);
      }
    );
  }

  // Getters
  get userId (): string { return this.m_userId; }
  get userFetching (): boolean { return this.m_userFetching; }
  get userError (): string { return this.m_userError; }
  get user (): User { return this.m_userResult; }

  get pollPage (): number { return this.m_pollPage; }
  get pollFetching (): boolean { return this.m_pollFetching; }
  get pollError (): string { return this.m_pollError; }
  get polls (): PollSearchResult[] { return this.m_pollResult; }
  get pollLastPage (): boolean { return this.m_pollLastPage; }

}
