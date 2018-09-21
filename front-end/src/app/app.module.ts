import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { LimitToPipe } from './limit-to.pipe';
import { AppComponent } from './app.component';
import { CalendarComponent } from './calendar/calendar.component';
import { SessionsListComponent } from './sessions-list/sessions-list.component';
import { SessionDetailComponent } from './session-detail/session-detail.component';

@NgModule({
  declarations: [
    AppComponent,
    CalendarComponent,
    SessionsListComponent,
    LimitToPipe,
    SessionDetailComponent
  ],
  imports: [
    BrowserModule,
    NgbModule.forRoot(),
    HttpClientModule
  ],
  entryComponents: [
    SessionDetailComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
