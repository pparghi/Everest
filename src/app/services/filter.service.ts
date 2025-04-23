import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

// This service is used to store the filter state of the application
// It allows keeping track of the filter state across different pages and components
export class FilterService {

  constructor() { }
  
  private allPageFilterState: any = {}; // json object to store filter state ie. { "page_name": {"filter1": "value1", "filter2": "value2"}, "page_name2": {"filter1":"value1", "filter2": "value2"} }


  /* ************************************************************
  * Description: This function is used to store filter state base on page name
  * Parameters: pageName: string, filterState: json object ie. { "filter1": "value1"}
  * Returns: void
  * ************************************************************ */
  setFilterState(pageName: string, filterState: any) {
    for (const key in filterState) {
      if (!this.allPageFilterState[pageName]) {
        this.allPageFilterState[pageName] = {}; // Initialize the page state if it doesn't exist
      }
      this.allPageFilterState[pageName][key] = filterState[key];
    }
  }

  /* ************************************************************
  * Description: This function is used to get filter state base on page name
  * Parameters: pageName: string
  * Returns: all states of a pafe n Json type ie. { "filter1": "value1"}
  * ************************************************************ */
  getFilterState(pageName: string) {
    return this.allPageFilterState[pageName];
  }
}
