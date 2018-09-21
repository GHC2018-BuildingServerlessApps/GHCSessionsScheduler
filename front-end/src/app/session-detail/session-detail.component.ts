import { Component } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Session } from '../session';
import { SessionsService } from '../sessions.service';

/**
* Component responsible for displaying the detailed view of a session
*/
@Component({
  selector: 'app-session-detail',
  templateUrl: './session-detail.component.html',
  styleUrls: ['./session-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessionDetailComponent {
  session: Session;

  constructor(public activeModal: NgbActiveModal,
    private sessionsService: SessionsService) {}

  /**
  * Adds the session to the calendar and refreshes the page
  * @param sessionId - the if of the session being added to the calendar
  */
  addToCalendar(sessionId: number): void {
    this.sessionsService.updateSession(sessionId, true)
      .subscribe(_ => this.activeModal.dismiss('Add to calendar'));
  }

  /**
  * Removes the session from the calendar and refreshes the page
  * @param sessionId - the if of the session being removed from the calendar
  */
  removeFromCalendar(sessionId: number): void {
    this.sessionsService.updateSession(sessionId, false)
      .subscribe(_ => this.activeModal.dismiss('Remove from calendar'));
  }

}
