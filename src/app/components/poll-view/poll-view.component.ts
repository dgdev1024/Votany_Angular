import { Component, OnInit, OnDestroy, ViewEncapsulation, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TokenService } from '../../services/token.service';
import { SocketService } from '../../services/socket.service';
import { PollService } from '../../services/poll.service';
import { FlashService, FlashType } from '../../services/flash.service';
import { Poll, PollChoice, PollComment } from '../../interfaces/poll';
import { VoteChartComponent } from '../vote-chart/vote-chart.component';
import * as moment from 'moment';

@Component({
  selector: 'app-poll-view',
  templateUrl: './poll-view.component.html',
  styles: [],
  encapsulation: ViewEncapsulation.None
})
export class PollViewComponent implements OnInit, OnDestroy {

  // Poll Variables
  private m_pollId: string = '';
  private m_pollFetching: boolean = false;
  private m_pollError: string = '';
  private m_pollResult: Poll = null;
  private m_pollRemoved: boolean = false;
  private m_pollEdited: boolean = false;

  // Choice Variables
  private m_choiceSelectedId: string = '';
  private m_choiceInput: string = '';
  private m_choiceVoting: boolean = false;
  private m_choiceAdding: boolean = false;
  private m_choiceError: string = '';

  // Comment Variables
  private m_commentPage: number = 0;
  private m_commentLastPage: boolean = true;
  private m_commentInput: string = '';
  private m_commentEditInput: string = '';
  private m_commentEditId: string = '';
  private m_commentFetching: boolean = false;
  private m_commentError: string = '';
  private m_commentInputError: string = '';
  private m_commentResult: PollComment[] = [];
  private m_commentAdding: boolean = false;
  private m_commentEditing: boolean = false;

  // Grab the Vote Chart.
  @ViewChild('votChart') voteChart: VoteChartComponent;

  ///
  /// @fn     initializeEvents
  /// @brief  Initializes our Socket.IO events.
  ///
  private initializeEvents() {
    // When a vote is cast...
    this.socketService.on('cast vote', (data) => {
      if (data['pollId'] === this.m_pollId) {
        for (const choice of this.m_pollResult.choices) {
          if (choice.choiceId === data['choiceId']) {
            choice.votes++;
            this.voteChart.initializeChart(this.m_pollResult.choices);
          }
        }
      }
    });

    // When a new choice is written in...
    this.socketService.on('add choice', (data) => {
      if (data['pollId'] === this.m_pollId) {
        this.m_pollResult.choices.push({
          choiceId: data['choiceId'],
          body: data['body'],
          votes: data['isAuthor'] ? 0 : 1
        });
        this.m_pollResult.edited = true;
        this.m_pollResult.editCount = data['editCount'];
        this.voteChart.initializeChart(this.m_pollResult.choices);
      }
    });

    // When a poll has been edited.
    this.socketService.on('edit poll', (data) => {
      if (data['pollId'] === this.m_pollId) {
        this.m_pollEdited = true;
      }
    });

    // When a poll has been removed.
    this.socketService.on('remove poll', (data) => {
      if (data['pollId'] === this.m_pollId) {
        this.m_pollRemoved = true;
      }
    });

    // When a comment has been posted.
    this.socketService.on('post comment', (data) => {
      if (data['pollId'] === this.m_pollId) {
        if (this.m_commentPage === 0) {
          this.m_commentResult.unshift({
            authorId: data['authorId'],
            authorName: data['authorName'],
            commentId: data['commentId'],
            body: data['body'],
            postDate: data['postDate'],
            deleted: false
          });

          if (this.m_commentResult.length > 20) {
            this.m_commentResult.pop();
            this.m_commentLastPage = false;
          }
        }
      }
    });

    // When a comment has been edited.
    this.socketService.on('edit comment', (data) => {
      if (data['pollId'] === this.m_pollId) {
        for (const comment of this.m_commentResult) {
          if (comment.commentId === data['commentId']) {
            comment.body = data['body'];
            break;
          }
        }
      }
    });
    
    // When a comment has been removed.
    this.socketService.on('remove comment', (data) => {
      if (data['pollId'] === this.m_pollId) {
        for (const comment of this.m_commentResult) {
          if (comment.commentId === data['commentId']) {
            comment.deleted = true;
            break;
          }
        }
      }
    });
  }

  ///
  /// @fn     fetchComments
  /// @brief  Fetches the comments on the poll.
  ///
  private fetchComments(page: number = 0) {
    this.m_commentFetching = true;
    this.m_commentError = '';
    this.m_commentPage = page;

    this.pollService.viewPollComments(this.m_pollId, page).subscribe(
      (response: PollComment[]) => {
        if (response.length === 0 && this.m_commentPage > 0) {
          this.fetchComments(0);
          return;
        }

        this.m_commentResult = response['comments'];
        this.m_commentLastPage = response['lastPage'];
        this.m_commentFetching = false;
        this.locationService.replaceState(
          `/poll/view/${this.m_pollId}`,
          `commentPage=${this.m_commentPage.toString()}`
        )
      },

      (error) => {
        const { message } = error.error['error'];
        this.m_commentError = message;
        this.m_commentFetching = false;
      }
    );
  }

  ///
  /// @fn     fetchPoll
  /// @brief  Fetches the requested poll.
  ///
  private fetchPoll(initSocket: boolean = true) {
    this.m_pollResult = null;
    this.m_pollFetching = true;

    this.pollService.viewPoll(this.m_pollId).subscribe(
      (response: Poll) => {
        response.postDateStr = moment(response.postDate).format('MMMM Do YYYY');
        this.m_pollResult = response;
        this.voteChart.initializeChart(this.m_pollResult.choices);

        if (initSocket === true) {
          this.initializeEvents();
        }

        this.m_pollFetching = false;
        this.titleService.setTitle(`${this.m_pollResult.issue} - Votany`);
      },

      (error) => {
        const { message } = error.error['error'];
        this.m_pollError = message;
        this.m_pollFetching = false;
      }
    );
  }

  constructor(
    private routerService: Router,
    private activatedRoute: ActivatedRoute,
    private locationService: Location,
    private titleService: Title,
    private tokenService: TokenService,
    private socketService: SocketService,
    private pollService: PollService,
    private flashService: FlashService
  ) { }

  ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      this.m_pollId = params['pollId'];
      this.fetchPoll();

      this.activatedRoute.queryParams.subscribe((params) => {
        const page = parseInt(params['commentPage']) || 0;
        this.fetchComments(page);
      });
    });
  }

  ngOnDestroy() {
    this.socketService.clear();
  }

  ///
  /// @fn     castVote
  /// @brief  Casts a vote on a poll.
  ///
  castVote(event) {
    event.preventDefault();

    if (this.m_choiceSelectedId === '') {
      this.m_choiceError = 'Please select a choice.';
      return;
    }

    this.m_choiceError = '';
    this.m_choiceVoting = true;

    this.pollService.castVote(this.m_pollId, this.m_choiceSelectedId).subscribe(
      (response) => {
        this.m_pollResult.hasVoted = true;
        this.m_pollResult.choiceVotedFor = this.m_choiceSelectedId;
        this.m_choiceSelectedId = '';
        this.m_choiceInput = '';
        this.m_choiceVoting = false;
      },

      (error) => {
        const { status, message } = error.error['error'];

        if (status === 401) {
          this.flashService.deploy(message, [], FlashType.Error);
          this.routerService.navigate(['/user/login'], {
            queryParams: {
              returnUrl: `/poll/view/${this.m_pollId}`,
              commentPage: this.m_commentPage.toString()
            }
          });
        } else {
          this.m_choiceError = message;
          this.m_choiceVoting = false;
        }
      }
    );
  }

  ///
  /// @fn     addChoice
  /// @brief  Adds a new choice to the poll.
  ///
  addChoice(event) {
    event.preventDefault();
    this.m_choiceError = '';
    this.m_choiceAdding = true;

    this.pollService.addChoice(this.m_pollId, this.m_choiceInput).subscribe(
      (response) => {
        this.m_pollResult.hasVoted = !this.isPollAuthor;
        this.m_pollResult.choiceVotedFor = this.isPollAuthor ? '' : response['choiceId'];
        this.m_choiceSelectedId = '';
        this.m_choiceInput = '';
        this.m_choiceAdding = false;
      },

      (error) => {
        const { status, message } = error.error['error'];

        if (status === 401) {
          this.flashService.deploy(message, [], FlashType.Error);
          this.routerService.navigate(['/user/login'], {
            queryParams: {
              returnUrl: `/poll/view/${this.m_pollId}`,
              commentPage: this.m_commentPage.toString()
            }
          });
        } else {
          this.m_choiceError = message;
          this.m_choiceAdding = false;
        }
      }
    )
  }

  ///
  /// @fn     postComment
  /// @brief  Posts a new comment on a poll.
  ///
  postComment(event) {
    event.preventDefault();
    this.m_commentInputError = '';
    this.m_commentAdding = true;

    this.pollService.postComment(this.m_pollId, this.m_commentInput).subscribe(
      (response) => {
        if (this.m_commentPage > 0) {
          this.fetchComments(0);
        }

        this.m_commentInput = '';
        this.m_commentAdding = false;
      },

      (error) => {
        const { status, message } = error.error['error'];

        if (status === 401) {
          this.flashService.deploy(message, [], FlashType.Error);
          this.routerService.navigate(['/user/login'], {
            queryParams: {
              returnUrl: `/poll/view/${this.m_pollId}`,
              commentPage: this.m_commentPage.toString()
            }
          });
        } else {
          this.m_commentInputError = message;
          this.m_commentAdding = false;
        }
      }
    );
  }

  ///
  /// @fn     editPoll
  /// @brief  Takes the poll's author to the Poll Editor to edit this poll.
  ///
  editPoll(event) {
    event.preventDefault();
    if (this.isPollAuthor) {
      this.routerService.navigate(['/poll/editor'], {
        queryParams: {
          editId: this.m_pollId
        }
      });
    }
  }

  ///
  /// @fn     setCommentEditId
  /// @brief  Sets the current comment edit ID.
  ///
  setCommentEditId(event, id: string) {
    event.preventDefault();

    if (id === '') {
      this.m_commentEditId = '';
      this.m_commentEditInput = '';
      return;
    }

    for (const comment of this.m_commentResult) {
      if (comment.commentId === id) {
        this.m_commentEditId = id;
        this.m_commentEditInput = comment.body;
        console.log(id);
        return;
      }
    }
  }

  ///
  /// @fn     editComment
  /// @brief  Edits a comment on a poll.
  ///
  editComment(event) {
    event.preventDefault();
    this.m_commentInputError = '';
    this.m_commentEditing = true;

    this.pollService.editComment(this.m_pollId, this.m_commentEditId, this.m_commentEditInput)
      .subscribe(
      (response) => {
        this.m_commentEditInput = '';
        this.m_commentEditId = '';
        this.m_commentEditing = false;
      },

      (error) => {
        const { status, message } = error.error['error'];

        if (status === 401) {
          this.flashService.deploy(message, [], FlashType.Error);
          this.routerService.navigate(['/user/login'], {
            queryParams: {
              returnUrl: `/poll/view/${this.m_pollId}`,
              commentPage: this.m_commentPage.toString()
            }
          });
        } else {
          this.m_commentInputError = message;
          this.m_commentEditing = false;
        }
      }
      );
  }

  ///
  /// @fn     removePoll
  /// @brief  Allows the poll's author to remove the poll.
  ///
  removePoll(event) {
    event.preventDefault();
    if (this.isPollAuthor) {
      const ays = confirm('This will delete your poll. Are you sure?');
      if (ays === false) { return; }

      this.pollService.removePoll(this.m_pollId).subscribe(
        (response) => {
          this.flashService.deploy(response['message'], [], FlashType.Error);
          this.routerService.navigate(['/'], { replaceUrl: true });
        },

        (error) => {
          const { status, message } = error.error['error'];
          this.flashService.deploy(message, [], FlashType.Error);

          if (status === 401) {
            this.routerService.navigate(['/user/login'], {
              queryParams: {
                returnUrl: `/poll/view/${this.m_pollId}`,
                commentPage: this.m_commentPage.toString()
              }
            });
          }
        }
      );
    }
  }

  ///
  /// @fn     removeComment
  /// @brief  Allows a comment's author to remove a comment on a poll.
  ///
  removeComment(event, id: string) {
    event.preventDefault();

    const ays = confirm('This will remove your comment. Are you sure?');
    if (ays === false) { return; }

    this.pollService.removeComment(this.m_pollId, id).subscribe(
      (response) => {
        this.fetchComments(this.m_commentPage);
      },

      (error) => {
        const { status, message } = error.error['error'];

        if (status === 401) {
          this.flashService.deploy(message, [], FlashType.Error);
          this.routerService.navigate(['/user/login'], {
            queryParams: {
              returnUrl: `/poll/view/${this.m_pollId}`,
              commentPage: this.m_commentPage.toString()
            }
          });
        } else {
          this.m_commentInputError = message;
          this.m_commentEditing = false;
        }
      }
    );
  }

  previousCommentPage(event) {
    event.preventDefault();
    if (this.m_commentPage > 0) {
      this.fetchComments(this.m_commentPage - 1);
    }
  }

  nextCommentPage(event) {
    event.preventDefault();
    if (this.m_commentLastPage === false) {
      this.fetchComments(this.m_commentPage + 1);
    }
  }

  // Poll Getters
  get poll(): Poll { return this.m_pollResult; }
  get pollFetching(): boolean { return this.m_pollFetching; }
  get pollError(): string { return this.m_pollError; }
  get pollGood(): boolean { return this.m_pollFetching === false && this.m_pollError === ''; }

  // Choice Getters
  get choiceSelectedId(): string { return this.m_choiceSelectedId; }
  get choiceInput(): string { return this.m_choiceInput; }
  get choiceVoting(): boolean { return this.m_choiceVoting; }
  get choiceAdding(): boolean { return this.m_choiceAdding; }
  get choiceError(): string { return this.m_choiceError; }

  // Comment Getters
  get commentPage(): number { return this.m_commentPage; }
  get commentLastPage(): boolean { return this.m_commentLastPage; }
  get commentInput(): string { return this.m_commentInput; }
  get commentEditInput(): string { return this.m_commentEditInput; }
  get commentEditId(): string { return this.m_commentEditId; }
  get commentFetching(): boolean { return this.m_commentFetching; }
  get commentError(): string { return this.m_commentError; }
  get commentInputError(): string { return this.m_commentInputError; }
  get commentResult(): PollComment[] { return this.m_commentResult; }
  get commentAdding(): boolean { return this.m_commentAdding; }
  get commentEditing(): boolean { return this.m_commentEditing; }

  // Getters to determine if a user is eligible to vote on the poll or add choices.
  get mustLogIn(): boolean { return this.m_pollResult && this.m_pollResult.requiresLogin && this.tokenService.check() === false; }
  get pollIsClosed(): boolean { return this.m_pollResult && this.m_pollResult.pollWillClose && this.m_pollResult.closed; }
  get isPollAuthor(): boolean { return this.m_pollResult && this.m_pollResult.isAuthor; }
  get hasVoted(): boolean { return this.m_pollResult && this.m_pollResult.hasVoted; }
  get votedFor(): string { return this.m_pollResult && this.m_pollResult.choiceVotedFor; }
  get pollRemoved(): boolean { return this.m_pollResult && this.m_pollRemoved; }
  get pollEdited(): boolean { return this.m_pollResult && this.m_pollEdited; }
  get cannotVote(): boolean { return this.m_pollResult && this.pollRemoved || this.m_pollEdited || this.mustLogIn || this.pollIsClosed || this.isPollAuthor || this.hasVoted; }
  get cannotAddChoices(): boolean { return this.m_pollResult && this.pollRemoved || this.m_pollEdited || this.tokenService.check() === false || this.hasVoted || (!this.m_pollResult.canAddExtraChoices && !this.isPollAuthor); }

  // Setters
  set choiceSelectedId(id: string) { this.m_choiceSelectedId = id; }
  set choiceInput(input: string) { this.m_choiceInput = input; }
  set commentInput(input: string) { this.m_commentInput = input; }
  set commentEditInput(input: string) { this.m_commentEditInput = input; }

}