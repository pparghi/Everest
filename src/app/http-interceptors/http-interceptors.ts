import { Injectable } from "@angular/core";
import { HttpEvent, HttpEventType, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { tap } from 'rxjs/operators';
import { CacheService } from "../services/cache.service";
import { AppConfig } from "../config/app.config";

@Injectable()

export class CacheInterceptor implements HttpInterceptor {

    constructor(private cacheService: CacheService) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // depending on sandbox mode setting to call API url with :4202 (production backend proxy) or :4302 (development backend proxy)
        const userId = localStorage.getItem('userId') || '';
        const settings = JSON.parse(localStorage.getItem('settings') || '{}');
        
        // Check if user is a test user and has sandbox mode enabled
        const isSandboxEnabled = AppConfig.testUserIds.includes(userId) && settings.SandboxModeSwitch === true;
        
        if (isSandboxEnabled && req.url.includes(':4202')) {
            req = req.clone({ url: req.url.replace(':4202', ':4302') });
        }

        if (req.method != 'GET') {
            return next.handle(req)
        }

        // console.log('CacheInterceptor: Intercepting request for URL:', req.url);
        // cache exceptions, we do not cache
        if ( req.url.includes('/api/creditRequests') || req.url.includes('/api/getClientSummaryNote') || req.url.includes('/api/MonitoringNotes') || 
            req.url.includes('/api/actionToCreditRequest') || req.url.includes('/api/ClientDetails') ) {
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