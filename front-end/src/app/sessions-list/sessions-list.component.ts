import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { SessionsService } from '../sessions.service';
import { SessionDetailComponent } from '../session-detail/session-detail.component';
import { SessionsByDay } from '../sessionsByDay';
import { Session } from '../session';
import SessionUtil from '../shared/session-util';

/**
* Component responsible for the logic to display the list of GHC sessions
*/
@Component({
  selector: 'app-sessions-list',
  templateUrl: './sessions-list.component.html',
  styleUrls: ['./sessions-list.component.css']
})
export class SessionsListComponent implements OnInit {
  sessionsByDay: SessionsByDay[];
  sessionsUpdateSubscription: Subscription;
  processingSession: number;

  constructor(private sessionsService: SessionsService,
    private modalService: NgbModal) {
  }

  /**
  * Groups and sets the sessions to the screen
  */
  setSessions(sessions): void {
    var sessionsByDay = sessions.reduce((obj, session) =>
    SessionUtil.groupSessions(obj, session), {});

    //Create SessionsByDay and sort sessions
    var sortedSessions: SessionsByDay[] = Object.keys(sessionsByDay)
      .map((key) => SessionUtil.sortGroupedSessions(key, sessionsByDay));

    var sortedGroups: SessionsByDay[] = SessionUtil.sortGroups(sortedSessions);

    this.sessionsByDay = sortedGroups;
  }

  /**
  * Upon initialization, retrieve all the sessions for display
  */
  ngOnInit() {
    this.setSessions(this.sessionsService.ghcSessions);

    this.sessionsUpdateSubscription = this.sessionsService
      .ghcSessionsChange.subscribe(sessions => {
        this.setSessions(sessions);
        this.processingSession = undefined;
      });
  }

  ngOnDestroy() {
    this.sessionsUpdateSubscription.unsubscribe();
  }

  /**
  * Open the detailed view of a session
  * @param session - the session for which the detailed view will be displayed
  */
  openSessionDetails(session: Session): void {
    const modalRef = this.modalService.open(SessionDetailComponent);
    modalRef.componentInstance.session = session;
  }

  /**
  * Scrolls the window back to the workshopDescription element
  */
  onScroll(elementId: string): void {
    window.document.getElementById(elementId).scrollIntoView();
  }

  /**
  * Adds the session to the calendar and refreshes the page
  * @param sessionId - the if of the session being added to the calendar
  */
  addToCalendar(sessionId: number): void {
    this.processingSession = sessionId;
    this.sessionsService.updateSession(sessionId, true).subscribe(_ => {
      console.log(`Added session id=${sessionId} to calendar`);
    });
  }

  /**
  * Removes the session from the calendar and refreshes the page
  * @param sessionId - the if of the session being removed from the calendar
  */
  removeFromCalendar(sessionId: number): void {
    this.processingSession = sessionId;
    this.sessionsService.updateSession(sessionId, false).subscribe(_ => {
      console.log(`Removed session id=${sessionId} from calendar`);
    });
  }
}
