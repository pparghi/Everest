import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache: Map<string, any> = new Map();

  constructor() { }

  put(url: string, response:any){
    this.cache.set(url, response);
  }

  get(url: string): any {
    return this.cache.get(url);
  }

  clear(){
    this.cache.clear();
  }

  // the function help to clean cache entries by partial URL match
  removeByPattern(urlPattern: string): void {
    this.cache.forEach((value, key) => {
      if (key.includes(urlPattern)) {
        this.cache.delete(key);
      }
    });
  }
  
}
