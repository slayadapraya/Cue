# Cue App

A working frontend based on [Cue App Design](https://www.figma.com/design/AZdRYW0T4sCSnHmlo59TKg/Cue-App-Design?node-id=0-1).

Open `index.html` in a browser, or run `./start.sh` (Linux/macOS) or `start.bat` (Windows) to serve it at http://localhost:8001.

Includes the Figma Home and Alarms screens, a calendar and alarm editor extending the design, and a new card-style dock with four equal labelled tabs and a 420 ms selection transition. Alarm toggles, repeat days, creation, editing, deletion, and calendar events work. Changes are saved locally in this browser.

The clock connection and hardware sync are demo states; this website does not send alarms to a physical clock or provide background operating-system alarms. The clock and date use the device’s local time and update automatically. The calendar opens on today in the current month, the Home strip shows the current week, and Next Alarm finds the next enabled future occurrence. Existing saved alarms and events are preserved. Sample one-time dates are relative to today on a fresh install.

Built with HTML, CSS and JavaScript. No install or build step. Original Figma SVG assets and a local font are included.

The most recently changed alarm uses the highlighted card style without changing list order. Switch thumbs animate in both directions, and the dock retains even outer gutters across all four views.

The original compact dock version is preserved separately in cue-app-original-dock-backup and its ZIP. This copy contains the new dock variant.

Settings includes a pitch-black theme with aqua accents. The choice is remembered in this browser. The compact dock is 64px tall and includes Home, Alarms, Calendar and Settings.
