
import { useEffect, useMemo, useState } from "react";
import "./index.css";

const API_URL = "https://localhost:7297/api/Attendance";
const REFRESH_INTERVAL = 30000;

function calculateDuration(inTime, outTime) {
  if (!inTime || !outTime) return "--";

  const start = new Date(inTime);
  const end = new Date(outTime);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return "--";
  }

  const totalMinutes = Math.floor((end - start) / 60000);

  if (totalMinutes < 1) return "Less than 1 min";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} mins`;
  if (minutes === 0) return `${hours} hr${hours === 1 ? "" : "s"}`;

  return `${hours} hr${hours === 1 ? "" : "s"} ${minutes} mins`;
}

function normalizeRecord(record) {
  const employeeId = String(
    record.personPin ??
      record.PersonPin ??
      record.employeeId ??
      record.EmployeeId ??
      ""
  ).trim();

  const rawName =
    record.employeeName ??
    record.EmployeeName ??
    record.name ??
    record.Name ??
    "";

  const inTime = record.inTime ?? record.InTime ?? null;
  const outTime = record.outTime ?? record.OutTime ?? null;

  const eventTime =
    record.eventTime ??
    record.EventTime ??
    inTime ??
    outTime ??
    null;

  const doorName = record.doorName ?? record.DoorName ?? "";

  const apiDuration =
    record.totalHours ??
    record.TotalHours ??
    record.totalTime ??
    record.TotalTime ??
    "";

  return {
    employeeId,
    employeeName: typeof rawName === "string" ? rawName.trim() : "",
    inTime,
    outTime,
    eventTime,
    doorName: String(doorName).trim(),
    totalHours: apiDuration || calculateDuration(inTime, outTime),
    direction: record.direction ?? record.Direction ?? "",
  };
}

function formatDateTime(value) {
  if (!value) return "--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getDateKey(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatExportDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return getDateKey(date);
}

function formatExportTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function escapeCSV(value) {
  let text = String(value ?? "");

  // Prevent Excel from interpreting untrusted text as a formula.
  if (/^[=+\-@\t\r]/.test(text)) {
    text = "'" + text;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

function App() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedDoor, setSelectedDoor] = useState("All Doors");
  const [selectedDate, setSelectedDate] = useState("");
  const [activeSection, setActiveSection] = useState("attendance");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // Load attendance data and refresh every 30 seconds.
  useEffect(() => {
    let cancelled = false;

    async function loadAttendance() {
      try {
        const response = await fetch(API_URL, {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("The attendance API did not return a list.");
        }

        if (!cancelled) {
          setRecords(data.map(normalizeRecord));
          setError("");
          setLastUpdated(new Date());
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            `Could not load attendance: ${err.message}. Check that the backend is running and the API URL is correct.`
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAttendance();

    const intervalId = setInterval(loadAttendance, REFRESH_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  // Build a unique employee list for search suggestions.
  const employees = useMemo(() => {
    const employeeMap = new Map();

    records.forEach((record) => {
      if (!record.employeeId) return;

      const existing = employeeMap.get(record.employeeId);

      employeeMap.set(record.employeeId, {
        id: record.employeeId,
        name: record.employeeName || existing?.name || "Unknown",
      });
    });

    return Array.from(employeeMap.values()).sort((a, b) =>
      a.id.localeCompare(b.id, undefined, { numeric: true })
    );
  }, [records]);

  // Show employee suggestions when searching by PIN or name.
  const searchSuggestions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return [];

    return employees
      .filter(
        (employee) =>
          employee.id.toLowerCase().includes(query) ||
          employee.name.toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [search, employees]);

  // Apply employee, door, and date filters.
  const filteredRecords = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return records.filter((record) => {
      const name = record.employeeName.toLowerCase();
      const id = record.employeeId.toLowerCase();
      const door = record.doorName.toLowerCase();

      const matchesSearch =
        name.includes(searchValue) || id.includes(searchValue);

      const matchesDoor =
        selectedDoor === "All Doors" ||
        door.includes(selectedDoor.toLowerCase());

      const dateForFilter =
        record.inTime || record.outTime || record.eventTime;

      const matchesDate =
        !selectedDate || getDateKey(dateForFilter) === selectedDate;

      return matchesSearch && matchesDoor && matchesDate;
    });
  }, [records, search, selectedDoor, selectedDate]);

  const uniqueEmployees = useMemo(
    () =>
      new Set(records.map((record) => record.employeeId).filter(Boolean))
        .size,
    [records]
  );

  // Export records currently shown after applying the filters.
  function exportEmployeeSummary() {
    if (filteredRecords.length === 0) {
      alert("No attendance records available to export.");
      return;
    }

    const headers = [
      "Employee ID (PIN)",
      "Employee Name",
      "Date",
      "In Time",
      "Out Time",
      "Door Name",
      "Total Working Hours",
    ];

    const sortedRecords = [...filteredRecords].sort((a, b) => {
      const timeA = new Date(
        a.inTime || a.eventTime || a.outTime || 0
      ).getTime();

      const timeB = new Date(
        b.inTime || b.eventTime || b.outTime || 0
      ).getTime();

      return timeA - timeB;
    });

    const rows = sortedRecords.map((record) => [
      record.employeeId,
      record.employeeName || "Unknown",
      formatExportDate(
        record.inTime || record.eventTime || record.outTime
      ),
      formatExportTime(record.inTime),
      formatExportTime(record.outTime),
      record.doorName,
      record.totalHours || calculateDuration(record.inTime, record.outTime),
    ]);

    const csvContent =
      "\uFEFF" +
      [headers, ...rows]
        .map((row) => row.map(escapeCSV).join(","))
        .join("\r\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const employeeIds = [
      ...new Set(sortedRecords.map((record) => record.employeeId).filter(Boolean)),
    ];

    const fileName =
      employeeIds.length === 1
        ? `Attendance_${employeeIds[0]}.csv`
        : "Attendance_Filtered_Records.csv";

    link.href = downloadUrl;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Attendance</h2>

        <nav>
          <div
            className={
              activeSection === "attendance"
                ? "menu-item active"
                : "menu-item"
            }
            onClick={() => setActiveSection("attendance")}
          >
            Dashboard
          </div>

          <div
            className={
              activeSection === "activity"
                ? "menu-item active"
                : "menu-item"
            }
            onClick={() => setActiveSection("activity")}
          >
            Recent Activity
          </div>
        </nav>
      </aside>

      <main className="main-content">
        <header className="header">
          <div>
            <h1>Attendance Dashboard</h1>
            <p>Attendance events from the company database</p>

            <small>
              {lastUpdated
                ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
                : "Waiting for attendance data..."}
            </small>
          </div>

          <div className="current-date">
            {new Date().toLocaleDateString()}
          </div>
        </header>

        <div className="cards">
          <div className="card card-total">
            <h3>Recent Records</h3>
            <p>{records.length}</p>
            <span>Loaded attendance visits</span>
          </div>

          <div className="card card-present">
            <h3>Employees in Records</h3>
            <p>{uniqueEmployees}</p>
            <span>Unique employee IDs</span>
          </div>

          <div className="card card-absent">
            <h3>Filtered Records</h3>
            <p>{filteredRecords.length}</p>
            <span>Records matching your filters</span>
          </div>
        </div>

        <div className="section-title">
          <div className="section-tabs">
            <button
              className={
                activeSection === "attendance"
                  ? "section-tab active"
                  : "section-tab"
              }
              onClick={() => setActiveSection("attendance")}
            >
              Attendance Records
            </button>

            <button
              className={
                activeSection === "activity"
                  ? "section-tab active"
                  : "section-tab"
              }
              onClick={() => setActiveSection("activity")}
            >
              Recent Activity
            </button>
          </div>
        </div>

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <p>Loading attendance records...</p>
        ) : (
          <>
            {activeSection === "attendance" && (
              <>
                <div className="filter-section">
                  <div className="search-wrapper">
                    <input
                      className="employee-search"
                      type="text"
                      placeholder="Search by employee ID or name..."
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => {
                        window.setTimeout(
                          () => setShowSuggestions(false),
                          150
                        );
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          setShowSuggestions(false);
                        }

                        if (
                          event.key === "Enter" &&
                          searchSuggestions.length > 0
                        ) {
                          const employee = searchSuggestions[0];
                          setSearch(employee.id);
                          setShowSuggestions(false);
                          event.preventDefault();
                        }
                      }}
                      autoComplete="off"
                      aria-label="Search attendance by employee ID or name"
                      aria-expanded={
                        showSuggestions && search.trim().length > 0
                      }
                    />

                    {showSuggestions && search.trim() && (
                      <div className="search-suggestions">
                        {searchSuggestions.length > 0 ? (
                          searchSuggestions.map((employee) => (
                            <button
                              type="button"
                              className="search-suggestion"
                              key={employee.id}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                setSearch(employee.id);
                                setShowSuggestions(false);
                              }}
                            >
                              <span className="suggestion-id">
                                {employee.id}
                              </span>

                              <span className="suggestion-name">
                                {employee.name}
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="no-suggestions">
                            No matching employees found
                          </div>
                        )}
                      </div>
                    )}

                    <label
                      htmlFor="attendance-date"
                      className="calendar-icon"
                      title="Filter by date"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="3"
                          y="5"
                          width="18"
                          height="16"
                          rx="2"
                        />
                        <path d="M16 3v4M8 3v4M3 11h18" />
                      </svg>
                    </label>

                    <input
                      id="attendance-date"
                      className="hidden-date-input"
                      type="date"
                      value={selectedDate}
                      onChange={(event) =>
                        setSelectedDate(event.target.value)
                      }
                      aria-label="Filter attendance by date"
                    />
                  </div>

                  <select
                    className="door-select"
                    value={selectedDoor}
                    onChange={(event) => setSelectedDoor(event.target.value)}
                  >
                    <option value="All Doors">All Doors</option>
                    <option value="Main">Main</option>
                    <option value="Masjid">Masjid</option>
                    <option value="Server">Server</option>
                  </select>

                  <button
                    type="button"
                    className="export-button"
                    onClick={exportEmployeeSummary}
                    disabled={filteredRecords.length === 0}
                  >
                    Export to Excel
                  </button>

                  {selectedDate && (
                    <button
                      type="button"
                      className="clear-date"
                      onClick={() => setSelectedDate("")}
                    >
                      Clear date
                    </button>
                  )}
                </div>

                {selectedDate && (
                  <p className="selected-date-label">
                    Showing records for{" "}
                    <strong>
                      {new Date(
                        `${selectedDate}T12:00:00`
                      ).toLocaleDateString()}
                    </strong>
                  </p>
                )}

                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Emp ID</th>
                        <th>Employee Name</th>
                        <th>In Time</th>
                        <th>Out Time</th>
                        <th>Door</th>
                        <th>Total Hours</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredRecords.map((record, index) => (
                        <tr
                          key={`${record.employeeId}-${record.eventTime}-${record.doorName}-${index}`}
                        >
                          <td>{record.employeeId || "--"}</td>
                          <td>{record.employeeName || "--"}</td>
                          <td>{formatDateTime(record.inTime)}</td>
                          <td>{formatDateTime(record.outTime)}</td>
                          <td>{record.doorName || "--"}</td>
                          <td>{record.totalHours || "--"}</td>
                        </tr>
                      ))}

                      {filteredRecords.length === 0 && (
                        <tr>
                          <td colSpan="6" className="no-data">
                            No attendance records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeSection === "activity" && (
              <div className="events-container">
                <div className="event event-header">
                  <div className="event-id">Emp ID</div>
                  <div className="event-name">Employee Name</div>
                  <div className="event-time">Event Time</div>
                </div>

                {records.map((record, index) => (
                  <div
                    className="event"
                    key={`${record.employeeId}-${record.eventTime}-${index}`}
                  >
                    <div className="event-id">
                      {record.employeeId || "--"}
                    </div>

                    <div className="event-name">
                      {record.employeeName || "Unknown"}
                      <small>
                        {" "}• {record.doorName || "Unknown door"}
                        {" "}• {record.totalHours || "Duration pending"}
                      </small>
                    </div>

                    <div className="event-time">
                      {formatDateTime(record.eventTime)}
                    </div>
                  </div>
                ))}

                {records.length === 0 && (
                  <p className="no-data">No recent activity found.</p>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
