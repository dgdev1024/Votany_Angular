import { Component, OnInit, OnDestroy, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { PollChoice } from '../../interfaces/poll';
import { getRandomInt } from '../../utility/random';
import * as cjs from 'chart.js';

@Component({
  selector: 'app-vote-chart',
  templateUrl: './vote-chart.component.html',
  styles: [],
  encapsulation: ViewEncapsulation.None
})
export class VoteChartComponent implements OnInit, OnDestroy {

  private chart: cjs = null;
  @ViewChild('votVoteChart') voteChart: ElementRef;

  constructor() { }

  ngOnInit() {
  }

  ngOnDestroy() {
    if (this.chart !== null) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  initializeChart(choices: PollChoice[]) {
    if (this.chart !== null) {
      this.chart.destroy();
      this.chart = null;
    }

    // Create the chart configuration.
    const config: cjs.ChartConfiguration = {
      type: 'pie',
      options: {
        animation: {
          duration: 0
        }
      },
      data: {
        labels: choices.map(c => c.body),
        datasets: [
          {
            data: choices.map(c => c.votes),
            backgroundColor: choices.map(c => `rgb(${getRandomInt(0, 255)}, ${getRandomInt(0, 255)}, ${getRandomInt(0, 255)})`)
          }
        ]
      }
    }

    this.chart = new cjs(this.voteChart.nativeElement.getContext('2d'), config);
  }

}
