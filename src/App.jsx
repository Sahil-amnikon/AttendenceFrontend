import { useState } from "react";
import "./index.css";

function App() {

  // Dummy data for now
  // Later this will come from your database/API
  const employees = [
    {
      empId: 101,
      empName: "Rahul",
      in: "09:02 AM",
      out: "06:05 PM",
      totalHours: "09:03",
      door: "Main",
      status: "Present",
      date: "08 Oct 2026"
    },
    {
      empId: 102,
      empName: "Amit",
      in: "09:15 AM",
      out: "06:20 PM",
      totalHours: "09:05",
      door: "Masjid",
      status: "Present",
      date: "08 Oct 2026"
    },
    {
      empId: 103,
      empName: "Priya",
      in: "08:55 AM",
      out: "05:45 PM",
      totalHours: "08:50",
      door: "Server",
      status: "Present",
      date: "08 Oct 2026"
    },
    {
      empId: 104,
      empName: "Neha",
      in: "09:05 AM",
      out: "06:10 PM",
      totalHours: "09:05",
      door: "Main",
      status: "Present",
      date: "08 Oct 2026"
    },
    {
      empId: 105,
      empName: "Rohit",
      in: "--",
      out: "--",
      totalHours: "--",
      door: "Masjid",
      status: "Absent",
      date: "08 Oct 2026"
    },
    {
      empId: 106,
      empName: "Sneha",
      in: "--",
      out: "--",
      totalHours: "--",
      door: "Server",
      status: "Absent",
      date: "08 Oct 2026"
    }
  ];


  const [search, setSearch] = useState("");
  const [selectedDoor, setSelectedDoor] = useState("All Doors");
  const [selectedList, setSelectedList] = useState(null);

  // Attendance / Recent Activity
  const [activeSection, setActiveSection] = useState("attendance");


  // Search by ID or Name + Door filter
  const filteredEmployees = employees.filter((employee) => {

    const searchValue = search.toLowerCase();

    const matchesSearch =
      employee.empName.toLowerCase().includes(searchValue) ||
      employee.empId.toString().includes(searchValue);

    const matchesDoor =
      selectedDoor === "All Doors" ||
      employee.door === selectedDoor;

    return matchesSearch && matchesDoor;
  });


  const totalEmployees = employees.length;

  const presentEmployees = employees.filter(
    (employee) => employee.status === "Present"
  );

  const absentEmployees = employees.filter(
    (employee) => employee.status === "Absent"
  );


  // Recent Activity
  const events = [
    {
      empId: 101,
      time: "09:02 AM",
      employee: "Rahul",
      action: "Entered",
      door: "Main"
    },
    {
      empId: 102,
      time: "09:15 AM",
      employee: "Amit",
      action: "Entered",
      door: "Masjid"
    },
    {
      empId: 103,
      time: "08:55 AM",
      employee: "Priya",
      action: "Entered",
      door: "Server"
    },
    {
      empId: 104,
      time: "09:05 AM",
      employee: "Neha",
      action: "Entered",
      door: "Main"
    }
  ];


  return (
    <div className="app">


      {/* ================= SIDEBAR ================= */}

      <aside className="sidebar">

        <h2>Attendance</h2>

        <nav>

          <div className="menu-item active">
            Dashboard
          </div>

          <div className="menu-item">
            Attendance
          </div>

          <div className="menu-item">
            Employees
          </div>

          <div className="menu-item">
            Events
          </div>

        </nav>

      </aside>


      {/* ================= MAIN CONTENT ================= */}

      <main className="main-content">


        {/* ================= HEADER ================= */}

        <div className="header">

          <div>

            <h1>Dashboard</h1>

            <p>
              Employee Attendance Overview
            </p>

          </div>

          <div className="current-date">
            08 October 2026
          </div>

        </div>


        {/* ================= SUMMARY CARDS ================= */}

        <div className="cards">


          {/* TOTAL EMPLOYEES */}

          <div
            className="card card-total clickable"
            onClick={() => setSelectedList("Total Employees")}
          >

            <h3>
              Total Employees
            </h3>

            <p>
              {totalEmployees}
            </p>

            <span>
              View employee list →
            </span>

          </div>


          {/* PRESENT */}

          <div
            className="card card-present clickable"
            onClick={() => setSelectedList("Present Today")}
          >

            <h3>
              Present Today
            </h3>

            <p>
              {presentEmployees.length}
            </p>

            <span>
              View present employees →
            </span>

          </div>


          {/* ABSENT */}

          <div
            className="card card-absent clickable"
            onClick={() => setSelectedList("Absent Today")}
          >

            <h3>
              Absent Today
            </h3>

            <p>
              {absentEmployees.length}
            </p>

            <span>
              View absent employees →
            </span>

          </div>

        </div>


        {/* ================= ATTENDANCE / RECENT ACTIVITY ================= */}

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


        {/* ================= ATTENDANCE RECORDS ================= */}

        {activeSection === "attendance" && (

          <>

            <div className="section-title">

              <div>

                <p>
                  Search employees by ID or name
                </p>

              </div>

            </div>


            {/* SEARCH + DOOR FILTER */}

            <div className="filter-section">

              <input
                type="text"
                placeholder="Search by employee ID or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />


              <select
                value={selectedDoor}
                onChange={(e) => setSelectedDoor(e.target.value)}
              >

                <option value="All Doors">
                  All Doors
                </option>

                <option value="Main">
                  Main
                </option>

                <option value="Masjid">
                  Masjid
                </option>

                <option value="Server">
                  Server
                </option>

              </select>

            </div>


            {/* ATTENDANCE TABLE */}

            <div className="table-container">

              <table>

                <thead>

                  <tr>

                    <th>
                      Emp ID
                    </th>

                    <th>
                      Employee Name
                    </th>

                    <th>
                      IN
                    </th>

                    <th>
                      OUT
                    </th>

                    <th>
                      Total Working Hours
                    </th>

                    <th>
                      Door
                    </th>

                    <th>
                      Status
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredEmployees.length > 0 ? (

                    filteredEmployees.map((employee) => (

                      <tr key={employee.empId}>

                        <td>
                          {employee.empId}
                        </td>

                        <td className="employee-name">
                          {employee.empName}
                        </td>

                        <td>
                          {employee.in}
                        </td>

                        <td>
                          {employee.out}
                        </td>

                        <td>
                          {employee.totalHours}
                        </td>

                        <td>
                          {employee.door}
                        </td>

                        <td>

                          <span
                            className={
                              employee.status === "Present"
                                ? "status present"
                                : "status absent"
                            }
                          >

                            {employee.status}

                          </span>

                        </td>

                      </tr>

                    ))

                  ) : (

                    <tr>

                      <td
                        colSpan="7"
                        className="no-data"
                      >
                        No employee found
                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          </>

        )}


        {/* ================= RECENT ACTIVITY ================= */}

        {activeSection === "activity" && (

          <div className="events-container">

            {/* ACTIVITY HEADER */}

            <div className="event event-header">

              <div className="event-id">
                Emp ID
              </div>

              <div className="event-name">
                Employee Name
              </div>

              <div className="event-time">
                IN Time
              </div>

            </div>


            {/* ACTIVITY DATA */}

            {events.map((event, index) => (

              <div
                className="event"
                key={index}
              >

                <div className="event-id">
                  {event.empId}
                </div>

                <div className="event-name">
                  {event.employee}
                </div>

                <div className="event-time">
                  {event.time}
                </div>

              </div>

            ))}

          </div>

        )}


      </main>


      {/* ================= POPUP LIST ================= */}

      {selectedList && (

        <div
          className="modal-overlay"
          onClick={() => setSelectedList(null)}
        >

          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="modal-header">

              <h2>
                {selectedList}
              </h2>

              <button
                onClick={() => setSelectedList(null)}
              >
                ×
              </button>

            </div>


            <div className="modal-list">

              {(selectedList === "Total Employees"
                ? employees
                : selectedList === "Present Today"
                ? presentEmployees
                : absentEmployees
              ).map((employee) => (

                <div
                  className="employee-row"
                  key={employee.empId}
                >

                  <div>

                    <strong>
                      {employee.empName}
                    </strong>

                    <span>
                      Employee ID: {employee.empId}
                    </span>

                  </div>

                  <span>
                    {employee.status}
                  </span>

                </div>

              ))}

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;