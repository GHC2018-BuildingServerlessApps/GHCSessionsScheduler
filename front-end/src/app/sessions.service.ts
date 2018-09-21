import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, Subject, Subscription } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Session } from './session';
import { SESSIONSLIST } from './mock-sessions-list';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

/**
* Service responsible for performing operations on GHC sessions
*/
@Injectable({
  providedIn: 'root'
})
export class SessionsService {

  private getSessionsUrl = undefined;
  private updateSessionsBaseUrl = undefined;

  ghcSessionsChange: Subject<Session[]> = new Subject<Session[]>();
  sessionsUpdateSubscription: Subscription;
  ghcSessions: Session[] = [];

  constructor(private http: HttpClient) {
    this.sessionsUpdateSubscription = this.ghcSessionsChange
      .subscribe(sessions => this.ghcSessions = sessions);
  }

  /**
  * Get all GHC Sessions from the server
  */
  getSessions(): Observable<Session[]> {

    if (!this.getSessionsUrl) {
      var sessions: Session[] = this.transformResponse(SESSIONSLIST);

      this.ghcSessionsChange.next(sessions);
      console.log(sessions);

      return of(sessions);
    }

    return this.http.get<Session[]>(this.getSessionsUrl)
    .pipe(
      tap(response => this.log('fetched sessions')),
      map(response => this.transformResponse(response)),
      //Propagate change in the sessions to all subscribers
      tap(sessions => this.ghcSessionsChange.next(sessions)),
      catchError(this.handleError('getSessions', []))
    );
  }

  transformResponse(response) {
    return response.map(
      //Convert server session to the format that the front end expects
      (serverSession) => {

        var startTime = serverSession.startDate + " " + serverSession.startTime + " EST";
        var endTime = serverSession.startDate + " " + serverSession.endTime + " EST";

        serverSession.startTime = new Date(startTime);
        serverSession.endTime = new Date(endTime);

        serverSession.isSelected ? serverSession.isSelected = true
          : serverSession.isSelected = false;
        serverSession.hasConflict ? serverSession.hasConflict = true
          : serverSession.hasConflict = false;

        return serverSession;
      }
    );
  }


  /**
  * Update the GHC Session in question to add it to or remove it from
  * the calendar
  * @param sessionId - identifier of the session being updated
  * @param isSelected - whether we are adding or removing the session from
  * the calendar
  */
  updateSession(sessionId: number, isSelected: boolean): Observable<any> {
    const updateInfo = {
      isSelected: isSelected ? 1 : 0
    };

    return this.http.post(this.updateSessionsBaseUrl.replace('{id}', sessionId.toString()),
      updateInfo, httpOptions).pipe(
        tap(_ => this.log(`updated session id=${sessionId}`)),
        tap(_ => this.getSessions().subscribe()),
        catchError(this.handleError<any>('updateSession'))
    );
  }

  /**
  * Handle Http operation that failed. Let the app continue.
  * @param operation - name of the operation that failed
  * @param result - optional value to return as the observable result
  */
  private handleError<T> (operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      this.log(`${operation} failed: ${error}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  /**
  * Logs a message. Currently using the console.
  * Could log by sending it to the server instead.
  * @param message - the message being logged
  */
  private log(message: string): void {
    console.log(message);
  }

}
