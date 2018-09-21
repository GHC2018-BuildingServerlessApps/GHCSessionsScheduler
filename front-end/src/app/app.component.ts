import { Component } from '@angular/core';
import { SessionsService } from './sessions.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'GHC Sessions Scheduler';
  description = 'View all GHC events and add the ones you are most interested in to your calendar.';

  constructor(private sessionsService: SessionsService) {
    //Populate the sessions data to make it available for the rest
    //of the application
    this.sessionsService.getSessions().subscribe();
  }


}
