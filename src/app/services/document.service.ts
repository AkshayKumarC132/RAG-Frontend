import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  constructor(private http: HttpClient) {}
  // private apiUrl = 'http://172.16.17.65:80/rag'; // Update with your backend URL

  // private apiUrl = 'http://127.0.0.1:8000/rag'; // Update with your backend URL

  private apiUrl = 'http://103.116.37.147/rag'; // Update with your backend URL



  ingestDocument(file: File): Observable<any> {
    const token = localStorage.getItem('authToken'); // Fetch token here
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/ingest/${token}/`, formData);
  }

  askQuestion(question: {
    question: string;
    vector_id?: string;
  }): Observable<any> {
    const token = localStorage.getItem('authToken'); // Fetch token here
    // const headers = new HttpHeaders().set('Authorization', `Token ${token}`);
    return this.http.post(`${this.apiUrl}/ask/${token}/`, question);
  }

  retrieveDocument(vectorId: string): Observable<any> {
    const token = localStorage.getItem('authToken'); // Fetch token here
    return this.http.get(
      `${this.apiUrl}/retrieve/document/${token}/${vectorId}`
    );
  }

  deleteDocument(vectorId: string): Observable<any> {
    const token = localStorage.getItem('authToken'); // Fetch token here
    return this.http.delete(`${this.apiUrl}/delete/${token}/${vectorId}`);
  }

  listDocuments(): Observable<any> {
    const token = localStorage.getItem('authToken'); // Fetch token here
    return this.http.get(`${this.apiUrl}/list-documents/${token}/`);
  }

  getChatHistory(vectorId: string) {
    const token = localStorage.getItem('authToken'); // Fetch token here
    return this.http.get<{ history: any[] }>(
      `${this.apiUrl}/chat-history/${token}/${vectorId}/`
    );
  }

  saveChatHistory(vectorId: string, history: any[]) {
    const token = localStorage.getItem('authToken'); // Fetch token here
    return this.http.post(`${this.apiUrl}/chat-history/${token}/${vectorId}/`, {
      history,
    });
  }

  clearChatHistory(vectorId: string) {
    const token = localStorage.getItem('authToken'); // Fetch token here
    return this.http.delete(
      `${this.apiUrl}/chat-history/${token}/${vectorId}/`
    );
  }

  askMultiFileQuestion(question: {
    question: string;
    vector_ids: string[];
  }): Observable<any> {
    const token = localStorage.getItem('authToken'); // Fetch token here
    return this.http.post(`${this.apiUrl}/multifile-ask/${token}/`, question);
  }
  
  askGlobalQuestion(question: { question: string }): Observable<any> {
    const token = localStorage.getItem('authToken'); // Fetch token here
    return this.http.post(`${this.apiUrl}/global-ask/${token}/`, question);
  }

  getDocumentAlerts(vectorId: string) {
    return this.http.get<any>(`${this.apiUrl}/document-alerts/${vectorId}/`);
  }


  saveMultiChatHistory(vector_ids: string[], history: any[]) {
    const token = localStorage.getItem('authToken'); // Fetch token here
    return this.http.post<any>(`${this.apiUrl}/chat-history-multifile/${token}/`, {
      vector_ids,
      history
    });
  }
  
  getMultiChatHistory(session_id: string) {
    const token = localStorage.getItem('authToken'); // Fetch token here
    return this.http.get<any>(`${this.apiUrl}/chat-history-multifile/${token}/`, {
      params: { session_id }
    });
  }
  
  clearMultiChatHistory(session_id: string) {
    const token = localStorage.getItem('authToken'); // Fetch token here
    return this.http.delete<any>(`${this.apiUrl}/chat-history-multifile/${token}/`, {
      params: { session_id }
    });
  }  
  
}
