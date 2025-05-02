import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // private apiUrl = 'http://172.16.17.65:80/rag'; // Update with your backend URL

  // private apiUrl = 'http://127.0.0.1:8000/rag'; // Update with your backend URL

  private apiUrl = 'http://103.116.37.147/rag'; // Update with your backend URL

  private tokenSubject = new BehaviorSubject<string | null>(null);
  token$ = this.tokenSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.tokenSubject.next(localStorage.getItem('authToken')); // Changed 'token' to 'authToken'
    }
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register/`, userData);
  }

  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login/`, credentials).pipe(
      tap((response: any) => {
        if (response.token) {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('authToken', response.token); // Changed 'token' to 'authToken'
          }
          this.tokenSubject.next(response.token);
        }
      })
    );
  }

  logout(): Observable<any> {
    const token = localStorage.getItem('authToken'); // Fetch token here
    return this.http.post(`${this.apiUrl}/logout/${token}/`, {}).pipe(
      tap(() => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.removeItem('authToken'); // Changed 'token' to 'authToken'
        }
        this.tokenSubject.next(null);
      })
    );
  }

  getProtectedData(): Observable<any> {
    const token = localStorage.getItem('authToken'); // Fetch token here
    return this.http.get(`${this.apiUrl}/protected/${token}/`);
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }
}
