import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FilterService {

  constructor() { }
  
  private filterState: any = {};

  setFilterState(state: any) {
    this.filterState = state;
  }

  getFilterState() {
    return this.filterState;
  }
}
