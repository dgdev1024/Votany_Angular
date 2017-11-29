import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { PollService } from '../../services/poll.service';
import { SocketService } from '../../services/socket.service';
import { TokenService } from '../../services/token.service';
import { PollSearchResult } from '../../interfaces/poll';

@Component({
  selector: 'app-poll-search',
  templateUrl: './poll-search.component.html',
  styles: [],
  encapsulation: ViewEncapsulation.None
})
export class PollSearchComponent implements OnInit {

  private m_method: string = '';
  private m_query: string = '';
  private m_fetching: boolean = false;
  private m_page: number = 0;
  private m_lastPage: boolean = false;
  private m_error: string = '';
  private m_results: PollSearchResult[] = [];

  private fetchResults (page: number = 0) {
    this.m_error = '';
    this.m_page = page;
    this.m_fetching = true;
    this.m_method = this.m_method ? this.m_method : 'recent';

    const onResponse = (response) => {
      this.m_results = response['polls'];
      this.m_lastPage = response['lastPage'];
      this.m_fetching = false;
      this.locationService.replaceState(
        '/poll/search',
        `method=${this.m_method}&page=${this.m_page.toString()}${this.m_query ? `&query=${this.m_query}` : ''}`
      );
    };

    const onError = (error) => {
      const { status, message } = error.error['error'];
      this.m_error = status !== 404 ? message : '';
      this.m_fetching = false;
    };

    switch (this.m_method) {
      case 'user':
        this.titleService.setTitle(`Polls By User - Page ${this.m_page + 1} -  Votany`);
        this.pollService.searchPollsByUser(this.m_query, this.m_page).subscribe(onResponse, onError);
        break;
      case 'keyword':
        this.titleService.setTitle(`Polls By Keyword - ${this.m_query} - Page ${this.m_page + 1} - Votany`);
        this.pollService.searchPolls(this.m_query, this.m_page).subscribe(onResponse, onError);
        break;
      case 'hot':
        this.titleService.setTitle(`Hot Polls - Page ${this.m_page + 1} - Votany`);
        this.pollService.searchHotPolls(this.m_page).subscribe(onResponse, onError);
        break;
      case 'recent':
      default:
        this.titleService.setTitle(`Recent Polls - Page ${this.m_page + 1} - Votany`);
        this.pollService.searchRecentPolls(this.m_page).subscribe(onResponse, onError);
        break;
    }
  }

  constructor(
    private routerService: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
    private locationService: Location,
    private tokenService: TokenService,
    private pollService: PollService,
    private socketService: SocketService
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe((params) => {
      const method = params['method'];
      const query = params['query'];
      const page = parseInt(params['page']) || 0;

      this.m_method = method ? method : 'recent';
      this.m_query = query ? query : '';
      this.m_page = page;

      this.fetchResults(this.m_page);
    });
  }

  onPreviousClicked () {
    if (this.m_page > 0) { this.fetchResults(this.m_page - 1); }
  }

  onNextClicked () {
    if (this.m_lastPage === false) { this.fetchResults(this.m_page + 1); }
  }

  get method (): string { return this.m_method; }
  get query (): string { return this.m_query; }
  get fetching (): boolean { return this.m_fetching; }
  get page (): number { return this.m_page; }
  get lastPage (): boolean { return this.m_lastPage; }
  get error (): string { return this.m_error; }
  get results (): PollSearchResult[] { return this.m_results; }

}
