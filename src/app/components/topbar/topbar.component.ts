import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from '../../services/token.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styles: [],
  encapsulation: ViewEncapsulation.None
})
export class TopbarComponent implements OnInit {

  private m_mobileMenuShown: boolean = false;
  private m_searchQuery: string = '';

  constructor(
    private routerService: Router,
    public tokenService: TokenService
  ) { }

  ngOnInit() {
  }

  toggleMobileMenu (): void {
    this.m_mobileMenuShown = !this.m_mobileMenuShown;
  }

  resetMobileMenu (): void {
    this.m_mobileMenuShown = false;
  }

  onSearchSubmit (event) {
    event.preventDefault();

    if (this.m_searchQuery !== '') {
      this.routerService.navigate(
        [ '/poll/search' ],
        {
          queryParams: {
            method: 'keyword',
            query: this.m_searchQuery,
            page: '0'
          }
        }
      );
    }
  }

  get mobileMenuShown (): boolean { return this.m_mobileMenuShown; }
  get searchQuery (): string { return this.m_searchQuery; }

  set searchQuery (query: string) { this.m_searchQuery = query; }

}
