import { Injectable } from "@angular/core";
import { HttpEvent, HttpEventType, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { tap } from 'rxjs/operators';
import { CacheService } from "../services/cache.service";

@Injectable()

export class CacheInterceptor implements HttpInterceptor {

    constructor(private cacheService: CacheService) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (req.method != 'GET') {
            return next.handle(req)
        }

        // console.log('CacheInterceptor: Intercepting request for URL:', req.url);
        // cache exceptions, we do not cache
        if ( req.url.includes('creditRequests') || req.url.includes('getClientSummaryNote') || req.url.includes('MonitoringNotes') || 
            req.url.includes('actionToCreditRequest')) {
            console.log('No caching for URL: ', req.url);
            return next.handle(req);
        }

        const cachedResponse = this.cacheService.get(req.url);
        if (cachedResponse) {
            // console.log('Got cache data for URL: ', req.url);
            return of(cachedResponse);
        }

        return next.handle(req).pipe(
            tap((event: HttpEvent<any>) => {
                if (event.type === HttpEventType.Response) {
                    this.cacheService.put(req.url, event);
                }
            })
        );
    }
}