(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["main"],{

/***/ "./src/$$_lazy_route_resource lazy recursive":
/*!**********************************************************!*\
  !*** ./src/$$_lazy_route_resource lazy namespace object ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function webpackEmptyAsyncContext(req) {
	// Here Promise.resolve().then() is used instead of new Promise() to prevent
	// uncaught exception popping up in devtools
	return Promise.resolve().then(function() {
		var e = new Error("Cannot find module '" + req + "'");
		e.code = 'MODULE_NOT_FOUND';
		throw e;
	});
}
webpackEmptyAsyncContext.keys = function() { return []; };
webpackEmptyAsyncContext.resolve = webpackEmptyAsyncContext;
module.exports = webpackEmptyAsyncContext;
webpackEmptyAsyncContext.id = "./src/$$_lazy_route_resource lazy recursive";

/***/ }),

/***/ "./src/app/app.component.css":
/*!***********************************!*\
  !*** ./src/app/app.component.css ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ""

/***/ }),

/***/ "./src/app/app.component.html":
/*!************************************!*\
  !*** ./src/app/app.component.html ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div id=\"workshopDescription\" class=\"jumbotron\">\n  <h1 class=\"display-4\">{{ title }}</h1>\n  <p class=\"lead\">{{ description }}</p>\n</div>\n<div class=\"row mt4\">\n  <div class=\"col pl-4\">\n    <app-calendar></app-calendar>\n  </div>\n</div>\n\n<app-sessions-list></app-sessions-list>\n"

/***/ }),

/***/ "./src/app/app.component.ts":
/*!**********************************!*\
  !*** ./src/app/app.component.ts ***!
  \**********************************/
/*! exports provided: AppComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AppComponent", function() { return AppComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _sessions_service__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./sessions.service */ "./src/app/sessions.service.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var AppComponent = /** @class */ (function () {
    function AppComponent(sessionsService) {
        this.sessionsService = sessionsService;
        this.title = 'GHC Sessions Scheduler';
        this.description = 'View all GHC events and add the ones you are most interested in to your calendar.';
        //Populate the sessions data to make it available for the rest
        //of the application
        this.sessionsService.getSessions().subscribe();
    }
    AppComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'app-root',
            template: __webpack_require__(/*! ./app.component.html */ "./src/app/app.component.html"),
            styles: [__webpack_require__(/*! ./app.component.css */ "./src/app/app.component.css")]
        }),
        __metadata("design:paramtypes", [_sessions_service__WEBPACK_IMPORTED_MODULE_1__["SessionsService"]])
    ], AppComponent);
    return AppComponent;
}());



/***/ }),

/***/ "./src/app/app.module.ts":
/*!*******************************!*\
  !*** ./src/app/app.module.ts ***!
  \*******************************/
/*! exports provided: AppModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AppModule", function() { return AppModule; });
/* harmony import */ var _angular_platform_browser__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/platform-browser */ "./node_modules/@angular/platform-browser/fesm5/platform-browser.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _ng_bootstrap_ng_bootstrap__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @ng-bootstrap/ng-bootstrap */ "./node_modules/@ng-bootstrap/ng-bootstrap/index.js");
/* harmony import */ var _angular_common_http__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/common/http */ "./node_modules/@angular/common/fesm5/http.js");
/* harmony import */ var _limit_to_pipe__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./limit-to.pipe */ "./src/app/limit-to.pipe.ts");
/* harmony import */ var _app_component__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./app.component */ "./src/app/app.component.ts");
/* harmony import */ var _calendar_calendar_component__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./calendar/calendar.component */ "./src/app/calendar/calendar.component.ts");
/* harmony import */ var _sessions_list_sessions_list_component__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./sessions-list/sessions-list.component */ "./src/app/sessions-list/sessions-list.component.ts");
/* harmony import */ var _session_detail_session_detail_component__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./session-detail/session-detail.component */ "./src/app/session-detail/session-detail.component.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};









var AppModule = /** @class */ (function () {
    function AppModule() {
    }
    AppModule = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["NgModule"])({
            declarations: [
                _app_component__WEBPACK_IMPORTED_MODULE_5__["AppComponent"],
                _calendar_calendar_component__WEBPACK_IMPORTED_MODULE_6__["CalendarComponent"],
                _sessions_list_sessions_list_component__WEBPACK_IMPORTED_MODULE_7__["SessionsListComponent"],
                _limit_to_pipe__WEBPACK_IMPORTED_MODULE_4__["LimitToPipe"],
                _session_detail_session_detail_component__WEBPACK_IMPORTED_MODULE_8__["SessionDetailComponent"]
            ],
            imports: [
                _angular_platform_browser__WEBPACK_IMPORTED_MODULE_0__["BrowserModule"],
                _ng_bootstrap_ng_bootstrap__WEBPACK_IMPORTED_MODULE_2__["NgbModule"].forRoot(),
                _angular_common_http__WEBPACK_IMPORTED_MODULE_3__["HttpClientModule"]
            ],
            entryComponents: [
                _session_detail_session_detail_component__WEBPACK_IMPORTED_MODULE_8__["SessionDetailComponent"]
            ],
            providers: [],
            bootstrap: [_app_component__WEBPACK_IMPORTED_MODULE_5__["AppComponent"]]
        })
    ], AppModule);
    return AppModule;
}());



/***/ }),

/***/ "./src/app/calendar/calendar.component.css":
/*!*************************************************!*\
  !*** ./src/app/calendar/calendar.component.css ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ".date {\n  font-weight: 400;\n  opacity: 0.5;\n}\n\n#calendarDateHeader:hover {\n  background-color: #f8f9fa;\n}\n\n.btn{\n  white-space:normal !important;\n}\n"

/***/ }),

/***/ "./src/app/calendar/calendar.component.html":
/*!**************************************************!*\
  !*** ./src/app/calendar/calendar.component.html ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div class=\"row justify-content-center pb-1\">\n  <h1>My Calendar</h1>\n</div>\n\n<div class=\"row pb-4 pr-2 justify-content-center\">\n  <div *ngIf=\"!calendarEvents || calendarEvents.length == 0\">\n    <h4>Your calendar is currently empty</h4>\n  </div>\n  <div\n    [ngClass]=\"{'col-sm-4': true, 'text-center': true, 'border-right': !isLast}\"\n    *ngFor=\"let calendarDay of calendarEvents; last as isLast\"\n  >\n    <div id=\"calendarDateHeader\" class=\"row\">\n      <h5 class=\"col-12\">{{ calendarDay.day | date:'EEEE' }}</h5>\n      <span class=\"col-12 date\">{{ calendarDay.day | date:'MMM d' }}</span>\n    </div>\n\n    <button\n      type=\"button\"\n      [ngClass]=\"{'btn': true , 'btn-sm': true, 'btn-outline-info': !session.hasConflict, 'btn-outline-danger': session.hasConflict, 'col-sm-12': true, 'mt-2': true, 'mb-2': true}\"\n      *ngFor=\"let session of calendarDay.sessions\"\n      (click)=\"openSessionDetails(session)\"\n    >\n      {{ session.startTime | date: 'hh:mm a' }} - {{ session.endTime | date: 'hh:mm a' }}: {{ session.name }}\n    </button>\n  </div>\n</div>\n"

/***/ }),

/***/ "./src/app/calendar/calendar.component.ts":
/*!************************************************!*\
  !*** ./src/app/calendar/calendar.component.ts ***!
  \************************************************/
/*! exports provided: CalendarComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CalendarComponent", function() { return CalendarComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _ng_bootstrap_ng_bootstrap__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @ng-bootstrap/ng-bootstrap */ "./node_modules/@ng-bootstrap/ng-bootstrap/index.js");
/* harmony import */ var _sessions_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../sessions.service */ "./src/app/sessions.service.ts");
/* harmony import */ var _session_detail_session_detail_component__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../session-detail/session-detail.component */ "./src/app/session-detail/session-detail.component.ts");
/* harmony import */ var _shared_session_util__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../shared/session-util */ "./src/app/shared/session-util.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};





/**
* Component responsible for constructing the view of sessions that have been
* added to the user's calendar
*/
var CalendarComponent = /** @class */ (function () {
    function CalendarComponent(sessionsService, modalService) {
        this.sessionsService = sessionsService;
        this.modalService = modalService;
    }
    /**
    * Component responsible for setting the events currently in the calendar
    */
    CalendarComponent.prototype.setCalendarEvents = function (sessions) {
        this.filterSessionsInCalendar(sessions);
    };
    /**
    * Filter sessions depending on whether or not they are in the calendar
    * @param sessions - the sessions to be filtered
    */
    CalendarComponent.prototype.filterSessionsInCalendar = function (sessions) {
        var filteredSessions = sessions.filter(function (session) { return session.isSelected; });
        //Group sessions by the day when they occur, ignoring the time
        var sessionsByDay = filteredSessions.reduce(function (obj, session) {
            return _shared_session_util__WEBPACK_IMPORTED_MODULE_4__["default"].groupSessions(obj, session);
        }, {});
        //Create SessionsByDay and sort sessions
        var sortedSessions = Object.keys(sessionsByDay)
            .map(function (key) { return _shared_session_util__WEBPACK_IMPORTED_MODULE_4__["default"].sortGroupedSessions(key, sessionsByDay); });
        var sortedGroups = _shared_session_util__WEBPACK_IMPORTED_MODULE_4__["default"].sortGroups(sortedSessions);
        this.calendarEvents = sortedGroups;
    };
    /**
    * Upon initialization, retrieve all the sessions for display
    */
    CalendarComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.setCalendarEvents(this.sessionsService.ghcSessions);
        this.sessionsUpdateSubscription = this.sessionsService
            .ghcSessionsChange.subscribe(function (sessions) {
            return _this.setCalendarEvents(sessions);
        });
    };
    CalendarComponent.prototype.ngOnDestroy = function () {
        this.sessionsUpdateSubscription.unsubscribe();
    };
    /**
    * Open the detailed view of a session
    * @param session - the session for which the detailed view will be displayed
    */
    CalendarComponent.prototype.openSessionDetails = function (session) {
        var modalRef = this.modalService.open(_session_detail_session_detail_component__WEBPACK_IMPORTED_MODULE_3__["SessionDetailComponent"]);
        modalRef.componentInstance.session = session;
    };
    CalendarComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'app-calendar',
            template: __webpack_require__(/*! ./calendar.component.html */ "./src/app/calendar/calendar.component.html"),
            styles: [__webpack_require__(/*! ./calendar.component.css */ "./src/app/calendar/calendar.component.css")]
        }),
        __metadata("design:paramtypes", [_sessions_service__WEBPACK_IMPORTED_MODULE_2__["SessionsService"],
            _ng_bootstrap_ng_bootstrap__WEBPACK_IMPORTED_MODULE_1__["NgbModal"]])
    ], CalendarComponent);
    return CalendarComponent;
}());



/***/ }),

/***/ "./src/app/limit-to.pipe.ts":
/*!**********************************!*\
  !*** ./src/app/limit-to.pipe.ts ***!
  \**********************************/
/*! exports provided: LimitToPipe */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LimitToPipe", function() { return LimitToPipe; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};

var LimitToPipe = /** @class */ (function () {
    function LimitToPipe() {
    }
    LimitToPipe.prototype.transform = function (value, args) {
        var limit = args ? args : 500;
        var trail = '...';
        return value.length > limit ? value.substring(0, limit) + trail : value;
    };
    LimitToPipe = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Pipe"])({ name: 'limitTo' })
    ], LimitToPipe);
    return LimitToPipe;
}());



/***/ }),

/***/ "./src/app/mock-sessions-list.ts":
/*!***************************************!*\
  !*** ./src/app/mock-sessions-list.ts ***!
  \***************************************/
/*! exports provided: SESSIONSLIST */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SESSIONSLIST", function() { return SESSIONSLIST; });
var SESSIONSLIST = [
    {
        startTime: "3:30 PM",
        location: "HIL Lanier J",
        endTime: "4:30 PM",
        isSelected: 1,
        audienceLevel: "All",
        track: "Career",
        hasConflict: 0,
        startDate: "Thursday, September 27, 2018",
        description: "Blockchain is said to revolutionize the world and break the barriers. Yet today, people of varied genders, ethnicities, educational and socioeconomic backgrounds are underrepresented. This panel will educate the audience on the technology and four Blockchain experts, will discuss what has already been delivered and what still needs to be changed to improve inclusion and diversity.",
        id: 251,
        speakers: "Alexandra Prodromos, Artiona Bogo, Dev Bharel, Hanna Zubko, Marta Piekarska",
        name: "CR110: Fulfilling the Broken Promise of Internet with Diversity in Mind"
    },
    {
        startTime: "12:00 PM",
        location: "MMQ Texan Ballroom D",
        endTime: "1:00 PM",
        isSelected: 0,
        audienceLevel: "Senior/Executive",
        track: "Career",
        hasConflict: 0,
        startDate: "Thursday, September 27, 2018",
        description: "Picture an entrepreneur. Does a white male Mark Zuckerberg type come to mind? While women have shown their strength in the startup world for a long time, female founders are still the exception, not the norm. What gives? This panel will debate what is causing this disparity - pipeline vs. culture, attitudes of men and women, the struggle for financing - and provide strategies to overcome the famine.",
        id: 187,
        speakers: "Mar Hershenson, Marci Meingast, Kate Brodock, Sydney Thomas, Maya Tobias",
        name: "CR402: The Female Founder Famine: Where are the Women Entrepreneurs?"
    },
    {
        location: "GRB 351C",
        isSelected: 0,
        track: "Interactive Media",
        name: "IM653: Game On: An Optimization Toolkit for Real-Time Graphics",
        startTime: "10:00 AM",
        endTime: "10:20 AM",
        audienceLevel: "Intermediate Tech",
        focusArea: "Streaming Media and Life Experiences",
        hasConflict: 0,
        startDate: "Thursday, September 27, 2018",
        description: "Performance is essential to fast, exciting game play on any platform. Come learn the tools of the trade used in the trenches, from Windows tools to built-in Unity and Unreal Engine profilers to Intel's GPA. Let's make fast, fantastic games!",
        id: 154,
        speakers: "Kelly Gawne"
    },
    {
        startTime: "11:00 AM",
        location: "HIL Meeting Room 340",
        endTime: "6:00 PM",
        isSelected: 1,
        audienceLevel: "Faculty",
        hasConflict: 1,
        startDate: "Wednesday, September 26, 2018",
        description: "The Faculty Lounge is a place for faculty and academic staff to informally network, catch up on work, and grab a snack or drink. The Faculty Lounge will be open throughout the conference where faculty and any other attendees with an Academic registration can come relax and take a break.",
        id: 7,
        name: "Faculty Lounge"
    },
    {
        startTime: "4:45 PM",
        location: "GRB 371C",
        endTime: "5:45 PM",
        isSelected: 0,
        audienceLevel: "Beginner Tech",
        track: "Open Source",
        hasConflict: 0,
        startDate: "Wednesday, September 26, 2018",
        description: "Becoming involved in a humanitarian free and open source software (HFOSS) project provides a wealth of learning opportunities for both students and faculty. However, choosing the right project can be daunting. Learning how to evaluate a project to determine viability for contribution is the first step. This workshop highlights various attributes to consider when selecting an HFOSS project.",
        id: 115,
        speakers: "Emily M. Lovell, Lori Postner, Darci Burdge",
        name: "OS541: Evaluating HFOSS Projects for Student Contribution (Repeat)"
    },
    {
        startTime: "9:00 AM",
        location: "GRB Exhibit Hall A",
        endTime: "11:30 AM",
        isSelected: 1,
        audienceLevel: "All",
        hasConflict: 0,
        startDate: "Friday, September 28, 2018",
        description: "Learn about the innovative technology the next generation is dreaming up on the following topics: Interactive Media, Machine Learning, Natural Language Processing and Software Engineering.",
        id: 286,
        speakers: "Shraddha Piparia, Shreya Sharma, Sharon Levy, Anandi Dutta, Haiman Tian, Azalia Mirhoseini, Zarana Parekh, Rafia Rahim, Meera Haridasa, Judy Hanwen Shen, Veena Gurumurthy, Tao Wang, Corina Florescu, Jessica Loeb, Neda Rohani, Manika Kapoor, Mehrnoosh Shafiee, Zahra Shakeri, Itika Gupta, Mitra Bokaei Hosseini, Jocelyn Lu, Tahsina Farah Sanam, Ashka Shah, Samira Pouyanfar, Tanjila Ahmed, Rakshmi Bhatia, Jeevjyot Singh Chhabda, Nikita Goel",
        name: "Poster Session 5"
    },
    {
        startTime: "12:35 PM",
        location: "HIL Ballroom of Americas D",
        endTime: "12:55 PM",
        isSelected: 0,
        audienceLevel: "Early Career",
        track: "Career",
        hasConflict: 0,
        startDate: "Friday, September 28, 2018",
        description: "Have you ever felt like a fraud in your profession, despite your accomplishments? Success should build confidence, not shake it, but many women and underrepresented minorities in the tech industry struggle with impostor syndrome. Explore and develop actionable strategies to overcome it, learn how self-talk shapes perceptions of worth and build a network to help you \"fake it till you make it.\"",
        id: 361,
        speakers: "Dena Haritos Tsamitis",
        name: "CR213: Fraud Alert: Shatter Impostor Syndrome"
    },
    {
        location: "GRB 320C",
        isSelected: 0,
        track: "Interactive Media",
        name: "IM528: Simulating Life: Autonomy in The Sims",
        startTime: "1:40 PM",
        endTime: "2:00 PM",
        audienceLevel: "Beginner Tech",
        focusArea: "Hands On Interactive Media",
        hasConflict: 0,
        startDate: "Friday, September 28, 2018",
        description: "How do we make a game about life? In this talk, we dig into how we use simple data structures as our building blocks in our autonomy system to create human-like behavior in The Sims. Moreover, we will explore what makes The Sims - a game seemingly about doing chores - a unique and fun experience for the players.",
        id: 380,
        speakers: "Bo Xian See"
    },
    {
        location: "GRB 342C",
        isSelected: 0,
        track: "Computer Systems Engineering",
        name: "CE504: An Introduction to Cloud Native World",
        startTime: "5:00 PM",
        endTime: "5:20 PM",
        audienceLevel: "Beginner Tech",
        focusArea: "System Management",
        hasConflict: 0,
        startDate: "Wednesday, September 26, 2018",
        description: "Cloud native application (CNA) paradigm can prove to be the key for making an application's lifecycle faster with more modular development, better architecture and more robust and efficient CICD pipelines. This presentation aims to introduce basics of CNA stack, that includes Docker, Kubernetes, role of cloud providers, and challenges involved in making production ready cloud native applications.",
        id: 117,
        speakers: "Prashima Sharma"
    },
    {
        startTime: "1:00 PM",
        location: "MMQ Texan Ballroom E",
        endTime: "2:00 PM",
        isSelected: 0,
        audienceLevel: "Senior/Executive",
        track: "Career",
        hasConflict: 0,
        startDate: "Wednesday, September 26, 2018",
        description: "We negotiate a variety of issues and items every day. How do you get what you need without burning bridges? We think of negotiations as \"win or lose\", yet lasting success requires a different approach. Whether you are negotiating project scope, client contacts, or your next promotion - how can you negotiate confidently and effectively? Learn practical techniques you can immediately apply.",
        id: 47,
        speakers: "Jodie Stewart, Ching Valdezco",
        name: "CR405: Six Steps to Successful Negotiations"
    },
    {
        startTime: "4:30 PM",
        location: "HIL Lanier B",
        endTime: "5:30 PM",
        isSelected: 0,
        audienceLevel: "Early Career",
        track: "Career",
        hasConflict: 0,
        startDate: "Wednesday, September 26, 2018",
        description: "Do you feel like you're bragging when you talk about your skills and accomplishments? Do you worry you don't have enough to offer when networking professionally? These are difficult issues all professional women face. If you can self promote authentically, networking and career discussions become easy. Join this session to learn how to identify the ways in which you are awesome and to communicate it while staying true to yourself.",
        id: 108,
        speakers: "Irene Ryabaya, Julia Genina",
        name: "CR201: The Art of Self-Promotion: How to Beat the Bragging Taboo (Repeat)"
    },
    {
        startTime: "4:00 PM",
        location: "HIL Ballroom of Americas C",
        endTime: "5:30 PM",
        isSelected: 0,
        audienceLevel: "All",
        track: "Lunches and Receptions",
        hasConflict: 0,
        startDate: "Wednesday, September 26, 2018",
        description: "Reception for Latinas in Computing Community. Promote and support Latina technologists from industry, government, and academia. This reception gives Latinas a chance to network with one another, connect with strong role models, and celebrate their accomplishments.",
        id: 98,
        name: "Latinas in Technical Roles Reception"
    },
    {
        location: "GRB 320C",
        isSelected: 1,
        track: "Products A to Z",
        name: "AZ669: So Many Features, So Little Time",
        startTime: "3:15 PM",
        endTime: "4:15 PM",
        audienceLevel: "Intermediate Tech",
        focusArea: "Conceptualization",
        hasConflict: 1,
        startDate: "Wednesday, September 26, 2018",
        description: "What does it take to deliver product features in a timely manner? In project management, it's not an easy feat to balance resources, time, and money, with your customers' needs and happiness. In this workshop, participants will learn what it's like to be part of a product team. Your team will prioritize features against development constraints and create a contingency plan when obstacles arise!",
        id: 85,
        speakers: "Eunice Yang, Kieu Tran, Daniel Rutledge"
    },
    {
        location: "GRB General Assembly C",
        isSelected: 0,
        track: "Artificial Intelligence",
        name: "AI612: Neuromorphic Computing: When Hardware Met AI",
        startTime: "3:40 PM",
        endTime: "4:00 PM",
        audienceLevel: "Intermediate Tech",
        focusArea: "Research Topics in AI",
        hasConflict: 0,
        startDate: "Wednesday, September 26, 2018",
        description: "The next big wave in AI will likely come in the form of custom hardware implementations of neural networks or neuromorphic computers. This presentation will provide an introduction to neuromorphic computing (NC), a perspective on the research questions and current results associated with NC and reflect on the opportunities for NC to revolutionize what we think of as AI and computing as a whole.",
        id: 95,
        speakers: "Catherine Schuman"
    }
];


/***/ }),

/***/ "./src/app/session-detail/session-detail.component.css":
/*!*************************************************************!*\
  !*** ./src/app/session-detail/session-detail.component.css ***!
  \*************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ""

/***/ }),

/***/ "./src/app/session-detail/session-detail.component.html":
/*!**************************************************************!*\
  !*** ./src/app/session-detail/session-detail.component.html ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div class=\"modal-header\">\n  <h5 class=\"modal-title\">{{ session.name }}</h5>\n  <button type=\"button\" class=\"close\" aria-label=\"Close\"\n    (click)=\"activeModal.dismiss('Cross click')\">\n    <span aria-hidden=\"true\">&times;</span>\n  </button>\n</div>\n\n<div class=\"modal-body\">\n  <p>\n    <span class=\"oi oi-clock\" title=\"Time\" aria-hidden=\"true\"></span>\n    {{ session.startTime | date: 'hh:mm a' }} - {{ session.endTime | date: 'hh:mm a' }}\n    <span\n      class=\"oi oi-map-marker pl-2\"\n      *ngIf=\"session.location\"\n      title=\"Location\"\n      aria-hidden=\"true\"\n    ></span>\n    {{ session.location ? session.location : ''}}\n    <span\n      class=\"oi oi-people pl-2\"\n      *ngIf=\"session.audienceLevel\"\n      title=\"Audience Level\"\n      aria-hidden=\"true\"\n    ></span>\n    {{ session.audienceLevel ? session.audienceLevel : '' }}\n    <span\n      class=\"oi oi-person pl-2\"\n      *ngIf=\"session.speakers\"\n      title=\"Speakers\"\n      aria-hidden=\"true\"\n    ></span>\n    {{ session.speakers ? 'Speakers: ' + session.speakers : '' }}\n  </p>\n\n  <p *ngIf=\"session.focusArea || session.track\">\n    <span class=\"oi oi-eye\"\n      *ngIf=\"session.focusArea\"\n      title=\"Focus Area\"\n      aria-hidden=\"true\"\n    ></span>\n    {{ session.focusArea ? 'Focus Area: ' + session.focusArea : ''}}\n    <span\n      [ngClass]=\"{'oi': true, 'oi-bolt': true, 'pl-2': session.focusArea}\"\n      *ngIf=\"session.track\"\n      title=\"Track\"\n      aria-hidden=\"true\"\n    ></span>\n    {{ session.track ? 'Track: ' + session.track : ''}}\n  </p>\n\n  <p></p>\n  <p *ngIf=\"session.description\">{{ session.description }}</p>\n  <p class=\"text-danger\" *ngIf=\"session.hasConflict\">\n    This session conflicts with another on your calendar\n  </p>\n</div>\n\n<div class=\"modal-footer\">\n  <button\n    *ngIf=\"!session.isSelected\"\n    class=\"btn btn-primary btn-sm\"\n    (click)=\"addToCalendar(session.id)\"\n  >\n    Add to Calendar\n  </button>\n  <button\n    *ngIf=\"session.isSelected\"\n    class=\"btn btn-danger btn-sm\"\n    (click)=\"removeFromCalendar(session.id)\"\n  >\n    Remove from Calendar\n  </button>\n\n  <button\n    type=\"button\"\n    class=\"btn btn-secondary\"\n    (click)=\"activeModal.close('Close click')\"\n  >\n    Close\n  </button>\n</div>\n"

/***/ }),

/***/ "./src/app/session-detail/session-detail.component.ts":
/*!************************************************************!*\
  !*** ./src/app/session-detail/session-detail.component.ts ***!
  \************************************************************/
/*! exports provided: SessionDetailComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SessionDetailComponent", function() { return SessionDetailComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _ng_bootstrap_ng_bootstrap__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @ng-bootstrap/ng-bootstrap */ "./node_modules/@ng-bootstrap/ng-bootstrap/index.js");
/* harmony import */ var _sessions_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../sessions.service */ "./src/app/sessions.service.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};




/**
* Component responsible for displaying the detailed view of a session
*/
var SessionDetailComponent = /** @class */ (function () {
    function SessionDetailComponent(activeModal, sessionsService) {
        this.activeModal = activeModal;
        this.sessionsService = sessionsService;
    }
    /**
    * Adds the session to the calendar and refreshes the page
    * @param sessionId - the if of the session being added to the calendar
    */
    SessionDetailComponent.prototype.addToCalendar = function (sessionId) {
        var _this = this;
        this.sessionsService.updateSession(sessionId, true)
            .subscribe(function (_) { return _this.activeModal.dismiss('Add to calendar'); });
    };
    /**
    * Removes the session from the calendar and refreshes the page
    * @param sessionId - the if of the session being removed from the calendar
    */
    SessionDetailComponent.prototype.removeFromCalendar = function (sessionId) {
        var _this = this;
        this.sessionsService.updateSession(sessionId, false)
            .subscribe(function (_) { return _this.activeModal.dismiss('Remove from calendar'); });
    };
    SessionDetailComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'app-session-detail',
            template: __webpack_require__(/*! ./session-detail.component.html */ "./src/app/session-detail/session-detail.component.html"),
            styles: [__webpack_require__(/*! ./session-detail.component.css */ "./src/app/session-detail/session-detail.component.css")],
            changeDetection: _angular_core__WEBPACK_IMPORTED_MODULE_0__["ChangeDetectionStrategy"].OnPush
        }),
        __metadata("design:paramtypes", [_ng_bootstrap_ng_bootstrap__WEBPACK_IMPORTED_MODULE_1__["NgbActiveModal"],
            _sessions_service__WEBPACK_IMPORTED_MODULE_2__["SessionsService"]])
    ], SessionDetailComponent);
    return SessionDetailComponent;
}());



/***/ }),

/***/ "./src/app/sessions-list/sessions-list.component.css":
/*!***********************************************************!*\
  !*** ./src/app/sessions-list/sessions-list.component.css ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ""

/***/ }),

/***/ "./src/app/sessions-list/sessions-list.component.html":
/*!************************************************************!*\
  !*** ./src/app/sessions-list/sessions-list.component.html ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div class=\"row justify-content-center pl-2 pb-1\">\n  <h1>GHC Sessions</h1>\n</div>\n\n<div class=\"row sticky-top float-right pr-4\">\n  <button\n    class=\"btn btn-secondary sticky-top float-right\"\n    (click)=\"onScroll('Wednesday')\"\n  >\n    Go to Wednesday\n  </button>\n  <button\n    class=\"btn btn-secondary\"\n    (click)=\"onScroll('Thursday')\"\n  >\n    Go to Thursday\n  </button>\n  <button\n    class=\"btn btn-secondary\"\n    (click)=\"onScroll('Friday')\"\n  >\n    Go to Friday\n  </button>\n  <button\n    class=\"btn btn-secondary\"\n    (click)=\"onScroll('workshopDescription')\"\n  >\n    Back to top\n  </button>\n</div>\n\n<div data-id=\"{{ sessionsGroup.day | date:'EEEE' }}\" class=\"pt-4\" *ngFor=\"let sessionsGroup of sessionsByDay\">\n  <div class=\"row pl-4\">\n    <h2>{{ sessionsGroup.day | date:'EEEE' }}</h2>\n  </div>\n\n  <div class=\"row p-1\">\n    <div\n      *ngFor=\"let session of sessionsGroup.sessions; let i = index\"\n      class=\"col-sm-4 mt-4\"\n    >\n      <div class=\"card border-secondary\">\n        <div class=\"card-header\">\n          {{ session.name }}\n        </div>\n\n        <div class=\"card-body\">\n          <h6 class=\"card-subtitle mb-2 text-muted\">\n            <span class=\"oi oi-clock\" title=\"Time\" aria-hidden=\"true\"></span>\n              {{ session.startTime | date: 'hh:mm a' }} - {{ session.endTime | date: 'hh:mm a' }}\n            <span class=\"oi oi-map-marker pl-2\"\n              *ngIf=\"session.location\"\n              title=\"Location\"\n              aria-hidden=\"true\"\n            ></span>\n              {{ session.location ? session.location : ''}}\n            <span\n              class=\"oi oi-people pl-2\"\n              *ngIf=\"session.audienceLevel\"\n              title=\"Audience Level\"\n              aria-hidden=\"true\"\n            ></span>\n              {{ session.audienceLevel ? session.audienceLevel : '' }}\n          </h6>\n\n          <p class=\"card-text text-justify\" *ngIf=\"session.description\">\n            {{ session.description | limitTo : 200 }}\n          </p>\n\n          <div class=\"row\">\n            <div class=\"col-6\">\n              <span class=\"float-left\">\n                <button\n                  class=\"btn btn-lg btn-link\"\n                  (click)=\"openSessionDetails(session)\"\n                >Read More</button>\n              </span>\n            </div>\n            <div class=\"col-6\">\n              <span class=\"float-right\">\n                <button\n                  *ngIf=\"!session.isSelected\"\n                  [ngClass]=\"{'btn': true, 'btn-primary': true, 'btn-sm': true, 'disabled': processingSession === session.id}\"\n                  (click)=\"addToCalendar(session.id)\"\n                >\n                  Add to Calendar\n                </button>\n                <button\n                  [id] = \"'removeFromCalendar' + session.id\"\n                  *ngIf=\"session.isSelected\"\n                  [ngClass]=\"{'btn': true, 'btn-danger': true, 'btn-sm': true, 'disabled': processingSession === session.id}\"\n                  (click)=\"removeFromCalendar(session.id)\"\n                >\n                  Remove from Calendar\n                </button>\n              </span>\n            </div>\n          </div>\n        </div>\n\n        <div class=\"card-footer text-muted\" *ngIf=\"session.hasConflict\">\n            <i>This session conflicts with another on your calendar</i>\n        </div>\n\n      </div>\n    </div>\n  </div>\n</div>\n"

/***/ }),

/***/ "./src/app/sessions-list/sessions-list.component.ts":
/*!**********************************************************!*\
  !*** ./src/app/sessions-list/sessions-list.component.ts ***!
  \**********************************************************/
/*! exports provided: SessionsListComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SessionsListComponent", function() { return SessionsListComponent; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _ng_bootstrap_ng_bootstrap__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @ng-bootstrap/ng-bootstrap */ "./node_modules/@ng-bootstrap/ng-bootstrap/index.js");
/* harmony import */ var _sessions_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../sessions.service */ "./src/app/sessions.service.ts");
/* harmony import */ var _session_detail_session_detail_component__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../session-detail/session-detail.component */ "./src/app/session-detail/session-detail.component.ts");
/* harmony import */ var _shared_session_util__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../shared/session-util */ "./src/app/shared/session-util.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};





/**
* Component responsible for the logic to display the list of GHC sessions
*/
var SessionsListComponent = /** @class */ (function () {
    function SessionsListComponent(sessionsService, modalService) {
        this.sessionsService = sessionsService;
        this.modalService = modalService;
    }
    /**
    * Groups and sets the sessions to the screen
    */
    SessionsListComponent.prototype.setSessions = function (sessions) {
        var sessionsByDay = sessions.reduce(function (obj, session) {
            return _shared_session_util__WEBPACK_IMPORTED_MODULE_4__["default"].groupSessions(obj, session);
        }, {});
        //Create SessionsByDay and sort sessions
        var sortedSessions = Object.keys(sessionsByDay)
            .map(function (key) { return _shared_session_util__WEBPACK_IMPORTED_MODULE_4__["default"].sortGroupedSessions(key, sessionsByDay); });
        var sortedGroups = _shared_session_util__WEBPACK_IMPORTED_MODULE_4__["default"].sortGroups(sortedSessions);
        this.sessionsByDay = sortedGroups;
    };
    /**
    * Upon initialization, retrieve all the sessions for display
    */
    SessionsListComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.setSessions(this.sessionsService.ghcSessions);
        this.sessionsUpdateSubscription = this.sessionsService
            .ghcSessionsChange.subscribe(function (sessions) {
            _this.setSessions(sessions);
            _this.processingSession = undefined;
        });
    };
    SessionsListComponent.prototype.ngOnDestroy = function () {
        this.sessionsUpdateSubscription.unsubscribe();
    };
    /**
    * Open the detailed view of a session
    * @param session - the session for which the detailed view will be displayed
    */
    SessionsListComponent.prototype.openSessionDetails = function (session) {
        var modalRef = this.modalService.open(_session_detail_session_detail_component__WEBPACK_IMPORTED_MODULE_3__["SessionDetailComponent"]);
        modalRef.componentInstance.session = session;
    };
    /**
    * Scrolls the window back to the workshopDescription element
    */
    SessionsListComponent.prototype.onScroll = function (elementId) {
        window.document.getElementById(elementId).scrollIntoView();
    };
    /**
    * Adds the session to the calendar and refreshes the page
    * @param sessionId - the if of the session being added to the calendar
    */
    SessionsListComponent.prototype.addToCalendar = function (sessionId) {
        this.processingSession = sessionId;
        this.sessionsService.updateSession(sessionId, true).subscribe(function (_) {
            console.log("Added session id=" + sessionId + " to calendar");
        });
    };
    /**
    * Removes the session from the calendar and refreshes the page
    * @param sessionId - the if of the session being removed from the calendar
    */
    SessionsListComponent.prototype.removeFromCalendar = function (sessionId) {
        this.processingSession = sessionId;
        this.sessionsService.updateSession(sessionId, false).subscribe(function (_) {
            console.log("Removed session id=" + sessionId + " from calendar");
        });
    };
    SessionsListComponent = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"])({
            selector: 'app-sessions-list',
            template: __webpack_require__(/*! ./sessions-list.component.html */ "./src/app/sessions-list/sessions-list.component.html"),
            styles: [__webpack_require__(/*! ./sessions-list.component.css */ "./src/app/sessions-list/sessions-list.component.css")]
        }),
        __metadata("design:paramtypes", [_sessions_service__WEBPACK_IMPORTED_MODULE_2__["SessionsService"],
            _ng_bootstrap_ng_bootstrap__WEBPACK_IMPORTED_MODULE_1__["NgbModal"]])
    ], SessionsListComponent);
    return SessionsListComponent;
}());



/***/ }),

/***/ "./src/app/sessions.service.ts":
/*!*************************************!*\
  !*** ./src/app/sessions.service.ts ***!
  \*************************************/
/*! exports provided: SessionsService */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SessionsService", function() { return SessionsService; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_common_http__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/common/http */ "./node_modules/@angular/common/fesm5/http.js");
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! rxjs */ "./node_modules/rxjs/_esm5/index.js");
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! rxjs/operators */ "./node_modules/rxjs/_esm5/operators/index.js");
/* harmony import */ var _mock_sessions_list__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./mock-sessions-list */ "./src/app/mock-sessions-list.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};





var httpOptions = {
    headers: new _angular_common_http__WEBPACK_IMPORTED_MODULE_1__["HttpHeaders"]({ 'Content-Type': 'application/json' })
};
/**
* Service responsible for performing operations on GHC sessions
*/
var SessionsService = /** @class */ (function () {
    function SessionsService(http) {
        var _this = this;
        this.http = http;
        this.getSessionsUrl = undefined;
        this.updateSessionsBaseUrl = undefined;
        this.ghcSessionsChange = new rxjs__WEBPACK_IMPORTED_MODULE_2__["Subject"]();
        this.ghcSessions = [];
        this.sessionsUpdateSubscription = this.ghcSessionsChange
            .subscribe(function (sessions) { return _this.ghcSessions = sessions; });
    }
    /**
    * Get all GHC Sessions from the server
    */
    SessionsService.prototype.getSessions = function () {
        var _this = this;
        if (!this.getSessionsUrl) {
            var sessions = this.transformResponse(_mock_sessions_list__WEBPACK_IMPORTED_MODULE_4__["SESSIONSLIST"]);
            this.ghcSessionsChange.next(sessions);
            console.log(sessions);
            return Object(rxjs__WEBPACK_IMPORTED_MODULE_2__["of"])(sessions);
        }
        return this.http.get(this.getSessionsUrl)
            .pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_3__["tap"])(function (response) { return _this.log('fetched sessions'); }), Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_3__["map"])(function (response) { return _this.transformResponse(response); }), 
        //Propagate change in the sessions to all subscribers
        Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_3__["tap"])(function (sessions) { return _this.ghcSessionsChange.next(sessions); }), Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_3__["catchError"])(this.handleError('getSessions', [])));
    };
    SessionsService.prototype.transformResponse = function (response) {
        return response.map(
        //Convert server session to the format that the front end expects
        function (serverSession) {
            var startTime = serverSession.startDate + " " + serverSession.startTime + " EST";
            var endTime = serverSession.startDate + " " + serverSession.endTime + " EST";
            serverSession.startTime = new Date(startTime);
            serverSession.endTime = new Date(endTime);
            serverSession.isSelected ? serverSession.isSelected = true
                : serverSession.isSelected = false;
            serverSession.hasConflict ? serverSession.hasConflict = true
                : serverSession.hasConflict = false;
            return serverSession;
        });
    };
    /**
    * Update the GHC Session in question to add it to or remove it from
    * the calendar
    * @param sessionId - identifier of the session being updated
    * @param isSelected - whether we are adding or removing the session from
    * the calendar
    */
    SessionsService.prototype.updateSession = function (sessionId, isSelected) {
        var _this = this;
        var updateInfo = {
            isSelected: isSelected ? 1 : 0
        };
        return this.http.post(this.updateSessionsBaseUrl.replace('{id}', sessionId.toString()), updateInfo, httpOptions).pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_3__["tap"])(function (_) { return _this.log("updated session id=" + sessionId); }), Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_3__["tap"])(function (_) { return _this.getSessions().subscribe(); }), Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_3__["catchError"])(this.handleError('updateSession')));
    };
    /**
    * Handle Http operation that failed. Let the app continue.
    * @param operation - name of the operation that failed
    * @param result - optional value to return as the observable result
    */
    SessionsService.prototype.handleError = function (operation, result) {
        var _this = this;
        if (operation === void 0) { operation = 'operation'; }
        return function (error) {
            _this.log(operation + " failed: " + error);
            // Let the app keep running by returning an empty result.
            return Object(rxjs__WEBPACK_IMPORTED_MODULE_2__["of"])(result);
        };
    };
    /**
    * Logs a message. Currently using the console.
    * Could log by sending it to the server instead.
    * @param message - the message being logged
    */
    SessionsService.prototype.log = function (message) {
        console.log(message);
    };
    SessionsService = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Injectable"])({
            providedIn: 'root'
        }),
        __metadata("design:paramtypes", [_angular_common_http__WEBPACK_IMPORTED_MODULE_1__["HttpClient"]])
    ], SessionsService);
    return SessionsService;
}());



/***/ }),

/***/ "./src/app/sessionsByDay.ts":
/*!**********************************!*\
  !*** ./src/app/sessionsByDay.ts ***!
  \**********************************/
/*! exports provided: SessionsByDay */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SessionsByDay", function() { return SessionsByDay; });
var SessionsByDay = /** @class */ (function () {
    function SessionsByDay() {
    }
    return SessionsByDay;
}());



/***/ }),

/***/ "./src/app/shared/session-util.ts":
/*!****************************************!*\
  !*** ./src/app/shared/session-util.ts ***!
  \****************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _sessionsByDay__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../sessionsByDay */ "./src/app/sessionsByDay.ts");

var SessionUtil = /** @class */ (function () {
    function SessionUtil() {
    }
    /**
    * Group sessions by the day when they occur (ignoring the time)
    * @param groupings - the object to hold the groupings
    * @param session - the session to be added to the group
    */
    SessionUtil.groupSessions = function (groupings, session) {
        var sessionDate = new Date(session.startTime);
        sessionDate.setHours(0, 0, 0, 0);
        var key = sessionDate.toString();
        groupings[key] = groupings[key] || [];
        groupings[key].push(session);
        return groupings;
    };
    /**
    * Sort the sessions under a group by startDate. If the start dates are the
    * same, then sort by endDate
    * @param key - the key of the group
    * @param sessionsByDay - the group that holds the session
    */
    SessionUtil.sortGroupedSessions = function (key, sessionsByDay) {
        var sessionGroup = new _sessionsByDay__WEBPACK_IMPORTED_MODULE_0__["SessionsByDay"]();
        sessionGroup.day = new Date(key);
        sessionGroup.sessions = sessionsByDay[key].sort(function (session1, session2) {
            return session1.startTime - session2.startTime
                || session1.endTime - session2.endTime;
        });
        return sessionGroup;
    };
    /**
    * Sort the groups of sessions by the day that they are for
    * @param sessionsByDay - An array of session groups
    */
    SessionUtil.sortGroups = function (sessionsByDay) {
        return sessionsByDay.sort(function (group1, group2) {
            var day1 = +group1.day;
            var day2 = +group2.day;
            return day1 - day2;
        });
    };
    return SessionUtil;
}());
/* harmony default export */ __webpack_exports__["default"] = (SessionUtil);


/***/ }),

/***/ "./src/environments/environment.ts":
/*!*****************************************!*\
  !*** ./src/environments/environment.ts ***!
  \*****************************************/
/*! exports provided: environment */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "environment", function() { return environment; });
// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
var environment = {
    production: false
};
/*
 * In development mode, for easier debugging, you can ignore zone related error
 * stack frames such as `zone.run`/`zoneDelegate.invokeTask` by importing the
 * below file. Don't forget to comment it out in production mode
 * because it will have a performance impact when errors are thrown
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.


/***/ }),

/***/ "./src/main.ts":
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_platform_browser_dynamic__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/platform-browser-dynamic */ "./node_modules/@angular/platform-browser-dynamic/fesm5/platform-browser-dynamic.js");
/* harmony import */ var _app_app_module__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./app/app.module */ "./src/app/app.module.ts");
/* harmony import */ var _environments_environment__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./environments/environment */ "./src/environments/environment.ts");




if (_environments_environment__WEBPACK_IMPORTED_MODULE_3__["environment"].production) {
    Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["enableProdMode"])();
}
Object(_angular_platform_browser_dynamic__WEBPACK_IMPORTED_MODULE_1__["platformBrowserDynamic"])().bootstrapModule(_app_app_module__WEBPACK_IMPORTED_MODULE_2__["AppModule"])
    .catch(function (err) { return console.log(err); });


/***/ }),

/***/ 0:
/*!***************************!*\
  !*** multi ./src/main.ts ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! /Users/agathao/Documents/GHC/GHCSessionsScheduler/front-end/src/main.ts */"./src/main.ts");


/***/ })

},[[0,"runtime","vendor"]]]);
//# sourceMappingURL=main.js.map