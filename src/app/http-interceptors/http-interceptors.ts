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

        const cachedResponse = this.cacheService.get(req.url);
        if (cachedResponse) {
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