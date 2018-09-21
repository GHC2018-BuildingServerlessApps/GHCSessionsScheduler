import { Session } from '../session';
import { SessionsByDay } from '../sessionsByDay';

export default class SessionUtil {

  /**
  * Group sessions by the day when they occur (ignoring the time)
  * @param groupings - the object to hold the groupings
  * @param session - the session to be added to the group
  */
  static groupSessions(groupings, session: Session) {
    const sessionDate = new Date(session.startTime);
    sessionDate.setHours(0,0,0,0);

    const key = sessionDate.toString();

    groupings[key] = groupings[key] || [];
    groupings[key].push(session);

    return groupings;
  }

  /**
  * Sort the sessions under a group by startDate. If the start dates are the
  * same, then sort by endDate
  * @param key - the key of the group
  * @param sessionsByDay - the group that holds the session
  */
  static sortGroupedSessions(key: string, sessionsByDay) {
    var sessionGroup = new SessionsByDay();
    sessionGroup.day = new Date(key);

    sessionGroup.sessions = sessionsByDay[key].sort(
      function(session1, session2) {
        return session1.startTime - session2.startTime
          || session1.endTime - session2.endTime;
      });

      return sessionGroup;
    }

    /**
    * Sort the groups of sessions by the day that they are for
    * @param sessionsByDay - An array of session groups
    */
    static sortGroups(sessionsByDay: SessionsByDay[]) {
      return sessionsByDay.sort(function(group1: SessionsByDay, group2: SessionsByDay) {
        var day1 = +group1.day;
        var day2 = +group2.day;

        return day1 - day2;
      });
    }
}
