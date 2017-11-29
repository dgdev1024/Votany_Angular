import { Component, AfterViewInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { DatetimeComponent } from '../datetime/datetime.component';
import { PollService } from '../../services/poll.service';
import { FlashType, FlashService } from '../../services/flash.service';
import { PollEditorOptions, Poll } from '../../interfaces/poll';

@Component({
  selector: 'app-poll-editor',
  templateUrl: './poll-editor.component.html',
  styles: [],
  encapsulation: ViewEncapsulation.None
})
export class PollEditorComponent implements AfterViewInit {

  private m_editId: string = '';
  private m_issue: string = '';
  private m_choices: string[] = [];
  private m_choiceInput: string = '';
  private m_editIndex: number = -1;
  private m_editInput: string = '';
  private m_keywords: string = '';
  private m_login: boolean = false;
  private m_add: boolean = true;
  private m_close: boolean = false;
  private m_choiceError: string = '';
  private m_pollError: string = '';
  private m_pollErrorDetails: string[] = [];
  @ViewChild('votCloseDate') closeDate: DatetimeComponent;

  private fetchForEditing () {
    this.pollService.viewPoll(this.m_editId).subscribe(
      (response: Poll) => {
        this.m_issue = response.issue;
        this.m_choices = response.choices.map(c => c.body);
        this.m_keywords = response.searchKeywords;
        this.m_login = response.requiresLogin;
        this.m_add = response.canAddExtraChoices;
        this.m_close = response.pollWillClose;

        if (this.m_close) {
          this.closeDate.setDate(new Date(response.closeDate).getTime());
        }

        this.titleService.setTitle(`Editing Poll - ${response.issue} - Votany`);
      },

      (error) => {
        const { message } = error.error['error'];
        this.m_pollError = message;
      }
    )
  }

  private createPoll () {
    this.pollService.createPoll({
      issue: this.m_issue,
      choices: this.m_choices,
      keywords: this.m_keywords,
      requiresLogin: this.m_login,
      canAddExtraChoices: this.m_add,
      pollWillClose: this.m_close,
      closeDate: this.m_close ? this.closeDate.getDate() : null
    }).subscribe(
      (response) => {
        this.flashService.deploy(response['message'], [], FlashType.OK);
        this.routerService.navigate([ `/poll/view/${response['pollId']}` ], { replaceUrl: true });
      },

      (error) => {
        const { status, message, details } = error.error['error'];

        if (status === 401) {
          this.flashService.deploy(message, [], FlashType.Error);
          this.routerService.navigate([ '/user/login' ], {
            replaceUrl: true,
            queryParams: this.m_editId ? { editId: this.m_editId } : {}
          });
        } else {
          this.m_pollError = message;
          this.m_pollErrorDetails = details;
        }
      }
    );
  }

  private editPoll () {
    this.pollService.editPoll(this.m_editId, {
      issue: this.m_issue,
      choices: this.m_choices,
      keywords: this.m_keywords,
      requiresLogin: this.m_login,
      canAddExtraChoices: this.m_add,
      pollWillClose: this.m_close,
      closeDate: this.m_close ? this.closeDate.getDate() : null
    }).subscribe(
      (response) => {
        this.flashService.deploy(response['message'], [], FlashType.OK);
        this.routerService.navigate([ `/poll/view/${response['pollId']}` ], { replaceUrl: true });
      },

      (error) => {
        const { status, message, details } = error.error['error'];

        if (status === 401) {
          this.flashService.deploy(message, [], FlashType.Error);
          this.routerService.navigate([ '/user/login' ], {
            replaceUrl: true,
            queryParams: this.m_editId ? { editId: this.m_editId } : {}
          });
        } else {
          this.m_pollError = message;
          this.m_pollErrorDetails = details;
        }
      }
    );
  }

  constructor(
    private titleService: Title,
    private routerService: Router,
    private activatedRoute: ActivatedRoute,
    private pollService: PollService,
    private flashService: FlashService
  ) { }

  ngAfterViewInit() {
    this.titleService.setTitle('Poll Editor - Votany');
    this.activatedRoute.queryParams.subscribe((params) => {
      const editId = params['editId'];
      this.m_editId = editId ? editId : '';

      if (editId) {
        this.fetchForEditing();
      }
    });
  }

  ///
  /// @fn     savePollDraft
  /// @brief  Commits a poll draft to memory, so the author can work on it later.
  ///
  savePollDraft () {
    const options = {
      issue: this.m_issue,
      choices: this.m_choices,
      keywords: this.m_keywords,
      requiresLogin: this.m_login,
      canAddExtraChoices: this.m_add,
      pollWillClose: this.m_close,
      closeDate: this.closeDate.getDate().getTime()
    };

    localStorage.setItem('-vot-poll-draft', JSON.stringify(options));
  }

  ///
  /// @fn     recallPollDraft
  /// @brief  Recalls a poll draft from memory, allowing the author to pick up where (s)he left off.
  ///
  recallPollDraft () {
    const pollDraftString = localStorage.getItem('-vot-poll-draft');
    if (!pollDraftString) { return; }

    try {
      const pollDraft = JSON.parse(pollDraftString);
      this.m_issue = pollDraft.issue;
      this.m_choices = pollDraft.choices;
      this.m_keywords = pollDraft.keywords;
      this.m_login = pollDraft.requiresLogin;
      this.m_add = pollDraft.canAddExtraChoices;
      this.m_close = pollDraft.pollWillClose;
      this.closeDate.setDate(pollDraft.closeDate);
    } catch(err) {}
  }

  ///
  /// @fn     isPollDraftSaved
  /// @brief  Checks to see if a poll draft is saved in local storage.
  ///
  isPollDraftSaved () {
    const pollDraftString = localStorage.getItem('-vot-poll-draft');
    return pollDraftString !== null;
  }

  ///
  /// @fn     clearPollDraft
  /// @brief  Clears the poll draft.
  ///
  clearPollDraft () {
    localStorage.removeItem('-vot-poll-draft');
  }

  ///
  /// @fn     addChoice
  /// @brief  Adds a new choice to the poll.
  ///
  addChoice (event) {
    event.preventDefault();

    if (this.m_choiceInput === '') {
      this.m_choiceError = 'Please enter a choice.';
    }
    else if (this.m_choiceInput.length > 140) {
      this.m_choiceError = 'Poll choices must contain 140 characters or fewer.';
    }
    else {
      this.m_choices.push(this.m_choiceInput);
      this.m_choiceInput = '';
    }
  }

  ///
  /// @fn     setChoiceEditIndex
  /// @brief  Primes an added poll choice for editing.
  ///
  setChoiceEditIndex (event, index: number) {
    event.preventDefault();

    if (index >= 0 && index < this.m_choices.length) {
      this.m_editIndex = index;
      this.m_editInput = this.m_choices[index];
      this.m_choiceError = '';
    }
  }

  ///
  /// @fn     finishEditingChoice
  /// @brief  Finishes editing the currently primed choice.
  ///
  finishEditingChoice (event, save: boolean) {
    event.preventDefault();
    
    if (save === true) {
      if (this.m_editInput === '') {
        this.m_choiceError = 'Please enter a choice.';
        return;
      }
      else if (this.m_editInput.length > 140) {
        this.m_choiceError = 'Poll choices must contain 140 characters or fewer.';
        return;
      }
      else {
        this.m_choices[this.m_editIndex] = this.m_editInput;
        this.m_choiceError = '';
      }
    }

    this.m_editIndex = -1;
  }

  ///
  /// @fn     removeChoice
  /// @brief  Removes a choice from the poll draft.
  ///
  removeChoice (event, index: number) {
    if (index >= 0 && index <= this.m_choices.length) {
      this.m_choices.splice(index, 1);
      this.m_choiceError = '';
    }
  }

  ///
  /// @fn     submitPoll
  /// @brief  Submits the poll for creation or editing.
  ///
  submitPoll (event) {
    event.preventDefault();
    if (this.m_editId === '') { this.createPoll(); }
    else { this.editPoll(); }
  }

  ///
  /// @fn     cancelEditing
  /// @brief  Cancels editing a poll.
  ///
  cancelEditing (event) {
    event.preventDefault();
  }

  // Getters
  get editingPoll (): boolean { return this.m_editId !== ''; }
  get issue (): string { return this.m_issue; }
  get choices (): string[] { return this.m_choices; }
  get choiceInput (): string { return this.m_choiceInput; }
  get choiceEditInput (): string { return this.m_editInput; }
  get choiceEditIndex (): number { return this.m_editIndex; }
  get keywords (): string { return this.m_keywords; }
  get requiresLogin (): boolean { return this.m_login; }
  get canAddExtraChoices (): boolean { return this.m_add; }
  get pollWillClose (): boolean { return this.m_close; }
  get choiceError (): string { return this.m_choiceError; }
  get pollError (): string { return this.m_pollError; }
  get pollErrorDetails (): string[] { return this.m_pollErrorDetails; }

  // Setters
  set issue (issue: string) { this.m_issue = issue; }
  set choiceInput (input: string) { this.m_choiceInput = input; }
  set choiceEditInput (input: string) { this.m_editInput = input; }
  set choiceEditIndex (index: number) { this.m_editIndex = index; }
  set keywords (keywords: string) { this.m_keywords = keywords; }
  set requiresLogin (login: boolean) { this.m_login = login; }
  set canAddExtraChoices (add: boolean) { this.m_add = add; }
  set pollWillClose (close: boolean) { this.m_close = close; }

}
