import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

const GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';

@Injectable()
export class UserIdInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only add header for specific requests to avoid unnecessary preflight
    if (request.url.includes('callNOAIRISAPI') && request.method === 'GET') {
      const userId = localStorage.getItem('userId') || '';
      const modifiedRequest = request.clone({
        headers: request.headers.set('X-User-Id', userId)
      });
      return next.handle(modifiedRequest);
    }
    
    return next.handle(request);
  }
}