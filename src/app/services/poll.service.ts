import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TokenService } from './token.service';
import { PollEditorOptions } from '../interfaces/poll';

@Injectable()
export class PollService {

  constructor(
    private httpService: HttpClient,
    private tokenService: TokenService
  ) { }

  createPoll (options: PollEditorOptions) {
    return this.httpService.post('/api/poll/create', {
      issue: options.issue,
      choices: options.choices,
      keywords: options.keywords,
      requiresLogin: options.requiresLogin,
      canAddExtraChoices: options.canAddExtraChoices,
      pollWillClose: options.pollWillClose,
      closeDate: options.pollWillClose ? options.closeDate : null
    }, this.tokenService.bearer());
  }

  postComment (id: string, body: string) {
    return this.httpService.post(`/api/poll/comment/${id}`, {
      pollId: id, body
    }, this.tokenService.bearer());
  }

  viewPoll (id: string) {
    return this.httpService.get(`/api/poll/view/${id}`, this.tokenService.bearer());
  }

  viewPollComments (id: string, page: number) {
    return this.httpService.get(`/api/poll/comments/${id}?page=${page}`);
  }

  searchPolls (query: string, page: number) {
    return this.httpService.get(`/api/poll/search?query=${query}&page=${page}`);
  }

  searchPollsByUser (id: string, page: number) {
    return this.httpService.get(`/api/poll/by/${id}?page=${page}`);
  }

  searchHotPolls (page: number) {
    return this.httpService.get(`/api/poll/hot?page=${page}`);
  }

  searchRecentPolls (page: number) {
    return this.httpService.get(`/api/poll/recent?page=${page}`);
  }

  castVote (pollId: string, choiceId: string) {
    return this.httpService.put(`/api/poll/vote/${pollId}`, {
      choiceId
    }, this.tokenService.bearer());
  }

  addChoice (pollId: string, body: string) {
    return this.httpService.put(`/api/poll/addChoice/${pollId}`, {
      body
    }, this.tokenService.bearer());
  }

  editPoll (pollId: string, options: PollEditorOptions) {
    return this.httpService.put(`/api/poll/edit/${pollId}`, {
      issue: options.issue,
      choices: options.choices,
      removedChoices: options.removedChoices,
      editedChoices: options.editedChoices,
      keywords: options.keywords,
      requiresLogin: options.requiresLogin,
      canAddExtraChoices: options.canAddExtraChoices,
      pollWillClose: options.pollWillClose,
      closeDate: options.pollWillClose ? options.closeDate : null
    }, this.tokenService.bearer());
  }

  editComment (pollId: string, commentId: string, body: string) {
    return this.httpService.put(`/api/poll/editComment/${pollId}`, {
      commentId, body
    }, this.tokenService.bearer());
  }

  removeComment (pollId: string, commentId: string) {
    return this.httpService.put(`/api/poll/removeComment/${pollId}`, {
      commentId
    }, this.tokenService.bearer());
  }

  removePoll (pollId: string) {
    return this.httpService.delete(`/api/poll/removePoll/${pollId}`,
      this.tokenService.bearer());
  }

}
