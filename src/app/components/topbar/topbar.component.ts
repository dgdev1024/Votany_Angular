import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { TokenService } from '../../services/token.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styles: [],
  encapsulation: ViewEncapsulation.None
})
export class TopbarComponent implements OnInit {

  private m_mobileMenuShown: boolean = false;

  constructor(
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

  get mobileMenuShown (): boolean { return this.m_mobileMenuShown; }

}
