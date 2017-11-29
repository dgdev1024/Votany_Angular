import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TokenService } from '../../services/token.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styles: [],
  encapsulation: ViewEncapsulation.None
})
export class HomeComponent implements OnInit {

  private m_search: string = '';

  constructor(private titleService: Title, private routerService: Router, public tokenService: TokenService) { }

  ngOnInit() {
    this.titleService.setTitle('Votany - Your Issues, Your Voice, Your Vote');
  }

  onSearchSubmit (event) {
    event.preventDefault();
    
    if (this.m_search !== '') {
      this.routerService.navigate(
        [ '/poll/search' ],
        {
          queryParams: {
            method: 'keyword',
            query: this.m_search,
            page: '0'
          }
        }
      );
    }
  }

  get search (): string { return this.m_search; }
  set search (search: string) { this.m_search = search; }

}
