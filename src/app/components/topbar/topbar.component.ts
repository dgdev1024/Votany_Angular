import { Component, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styles: [],
  encapsulation: ViewEncapsulation.None
})
export class TopbarComponent implements OnInit {

  private m_mobileMenuShown: boolean = false;

  constructor() { }

  ngOnInit() {
  }

  toggleMobileMenu (): void {
    this.m_mobileMenuShown = !this.m_mobileMenuShown;
  }

  get mobileMenuShown (): boolean { return this.m_mobileMenuShown; }

}
