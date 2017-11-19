///
/// @file   flash.component.ts
/// @brief  Displays the flash box onscreen.
///

import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FlashService, FlashType } from '../../services/flash.service';

@Component({
  selector: 'app-flash',
  templateUrl: './flash.component.html',
  styles: [],
  encapsulation: ViewEncapsulation.None
})
export class FlashComponent implements OnInit {
  
  constructor(
    public flashService: FlashService
  ) { }

  ngOnInit() {
  }

}