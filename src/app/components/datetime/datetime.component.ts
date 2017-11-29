import { Component, OnInit, ViewEncapsulation, ViewChild, Input } from '@angular/core';

@Component({
  selector: 'app-datetime',
  templateUrl: './datetime.component.html',
  styles: [],
  encapsulation: ViewEncapsulation.None
})
export class DatetimeComponent implements OnInit {

  @ViewChild('votMonth') selectMonth;
  @ViewChild('votDay') selectDay;
  @ViewChild('votYear') selectYear;
  @ViewChild('votHour') selectHour;
  @ViewChild('votMinute') selectMinute;
  @Input() disabled: boolean = false;

  constructor() { }

  populateDays () {
    const daySelect = this.selectDay.nativeElement;
    const yearSelect = this.selectYear.nativeElement;
    const monthSelect = this.selectMonth.nativeElement;
    const month = monthSelect.value;
    while (daySelect.firstChild) {
      daySelect.removeChild(daySelect.firstChild);
    }

    let numberOfDays = null;
    if(month === 'January' || month === 'March' || month === 'May' || month === 'July' || month === 'August' || month === 'October' || month === 'December') {
      numberOfDays = 31;
    } else if(month === 'April' || month === 'June' || month === 'September' || month === 'November') {
      numberOfDays = 30;
    } else {
      const year = yearSelect.value;
      numberOfDays = (year - 2016) % 4 === 0 ? 29 : 28;
    }

    for (let i = 1; i <= numberOfDays; i++) {
      let option = document.createElement('option');
      option.textContent = i.toString();
      daySelect.appendChild(option);
    }

    daySelect.value = '1';
  }

  populateYears () {
    const yearSelect = this.selectYear.nativeElement;
    const year = new Date().getFullYear();
    for (let i = 0; i <= 20; ++i) {
      let option = document.createElement('option');
      option.textContent = (year + i).toString();
      yearSelect.appendChild(option);
    }
  }

  populateHours () {
    const hourSelect = this.selectHour.nativeElement;
    for (let i = 0; i <= 23; ++i) {
      let option = document.createElement('option');
      option.textContent = ((i < 10) ? ("0" + i) : i).toString();
      hourSelect.appendChild(option);
    }
  }

  populateMinutes () {
    const minuteSelect = this.selectMinute.nativeElement;
    for (let i = 0; i <= 59; ++i) {
      let option = document.createElement('option');
      option.textContent = ((i < 10) ? ("0" + i) : i).toString();
      minuteSelect.appendChild(option);
    }
  }

  getDate () {
    return new Date(
      this.selectYear.nativeElement.value,
      this.selectMonth.nativeElement.selectedIndex,
      this.selectDay.nativeElement.value,
      this.selectHour.nativeElement.value,
      this.selectMinute.nativeElement.value
    );
  }

  setDate (unix: number) {
    const date = new Date(unix);
    const hour = date.getHours();
    const minute = date.getMinutes();
    let monthStr = '';

    switch (date.getMonth()) {
      case 0: monthStr = 'January'; break;
      case 1: monthStr = 'February'; break;
      case 2: monthStr = 'March'; break;
      case 3: monthStr = 'April'; break;
      case 4: monthStr = 'May'; break;
      case 5: monthStr = 'June'; break;
      case 6: monthStr = 'July'; break;
      case 7: monthStr = 'August'; break;
      case 8: monthStr = 'September'; break;
      case 9: monthStr = 'October'; break;
      case 10: monthStr = 'November'; break;
      case 11: monthStr = 'December'; break;
    }
    
    this.populateDays();
    this.populateHours();
    this.populateMinutes();
    this.populateYears();

    const currentYear = new Date().getFullYear();

    this.selectMonth.nativeElement.value = monthStr;
    this.selectDay.nativeElement.value = date.getDate().toString();
    this.selectHour.nativeElement.value = ((hour < 10) ? ("0" + hour) : hour).toString();
    this.selectMinute.nativeElement.value = ((minute < 10) ? ("0" + minute) : minute).toString();
    this.selectYear.nativeElement.value = ((date.getFullYear() < currentYear) ? 
      currentYear : date.getFullYear()).toString();
  }

  ngOnInit() {
    const now = new Date();
    const month = now.getMonth();
    const date = now.getDate();
    const hour = now.getHours();
    const minute = now.getMinutes();
    let monthStr = '';

    switch (month) {
      case 0: monthStr = 'January'; break;
      case 1: monthStr = 'February'; break;
      case 2: monthStr = 'March'; break;
      case 3: monthStr = 'April'; break;
      case 4: monthStr = 'May'; break;
      case 5: monthStr = 'June'; break;
      case 6: monthStr = 'July'; break;
      case 7: monthStr = 'August'; break;
      case 8: monthStr = 'September'; break;
      case 9: monthStr = 'October'; break;
      case 10: monthStr = 'November'; break;
      case 11: monthStr = 'December'; break;
    }

    this.populateHours();
    this.populateMinutes();

    this.selectMonth.nativeElement.value = monthStr;
    this.selectHour.nativeElement.value = ((hour < 10) ? ("0" + hour) : hour).toString();
    this.selectMinute.nativeElement.value = ((minute < 10) ? ("0" + minute) : minute).toString();
    this.populateYears();
    this.populateDays();
    this.selectDay.nativeElement.value = date.toString();
  }

}
