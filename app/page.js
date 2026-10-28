
"use client";

import {
  Users,
  Stethoscope,
  CalendarCheck,
  Wallet,
  Plus,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  MoreHorizontal,
} from "lucide-react";

const stats = [
  {
    label: "Total Patients",
    value: "2,840",
    change: "+12.5%",
    note: "vs. last month",
    icon: Users,
    color: "#2563eb",
    bg: "#eff6ff",
  },
  {
    label: "Active Doctors",
    value: "48",
    change: "+4.2%",
    note: "vs. last month",
    icon: Stethoscope,
    color: "#0d9488",
    bg: "#f0fdfa",
  },
  {
    label: "Appointments",
    value: "186",
    change: "+8.1%",
    note: "this month",
    icon: CalendarCheck,
    color: "#7c3aed",
    bg: "#f5f3ff",
  },
  {
    label: "Revenue",
    value: "₹4.82L",
    change: "+10.3%",
    note: "vs. last month",
    icon: Wallet,
    color: "#d97706",
    bg: "#fffbeb",
  },
];

const appointments = [
  {
    id: "APT-1001",
    name: "Aarav Sharma",
    initials: "AS",
    specialty: "General Medicine",
    doctor: "Dr. Sarah Wilson",
    time: "09:00 AM",
    status: "Confirmed",
    color: "#dbeafe",
    textColor: "#1d4ed8",
  },
  {
    id: "APT-1002",
    name: "Ananya Rao",
    initials: "AR",
    specialty: "Cardiology",
    doctor: "Dr. Michael Chen",
    time: "09:30 AM",
    status: "Pending",
    color: "#f3e8ff",
    textColor: "#7e22ce",
  },
  {
    id: "APT-1003",
    name: "Rohan Mehta",
    initials: "RM",
    specialty: "Dermatology",
    doctor: "Dr. Priya Patel",
    time: "10:00 AM",
    status: "Confirmed",
    color: "#dcfce7",
    textColor: "#15803d",
  },
  {
    id: "APT-1004",
    name: "Diya Nair",
    initials: "DN",
    specialty: "Orthopedics",
    doctor: "Dr. James Wilson",
    time: "10:30 AM",
    status: "Completed",
    color: "#ffedd5",
    textColor: "#c2410c",
  },
  {
    id: "APT-1005",
    name: "Kabir Verma",
    initials: "KV",
    specialty: "General Medicine",
    doctor: "Dr. Sarah Wilson",
    time: "11:00 AM",
    status: "Pending",
    color: "#fce7f3",
    textColor: "#be185d",
  },
];

const weeklyActivity = [
  { day: "Mon", appointments: 42, patients: 28 },
  { day: "Tue", appointments: 55, patients: 36 },
  { day: "Wed", appointments: 47, patients: 31 },
  { day: "Thu", appointments: 72, patients: 48 },
  { day: "Fri", appointments: 61, patients: 41 },
  { day: "Sat", appointments: 83, patients: 56 },
  { day: "Sun", appointments: 38, patients: 24 },
];

export default function HomePage() {
  const maxValue = Math.max(
    ...weeklyActivity.map((item) => item.appointments)
  );

  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">OVERVIEW</div>
          <h1 className="page-title">Good morning, Admin 👋</h1>
          <p className="page-description">
            Here&apos;s what&apos;s happening at your healthcare facility today.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => alert("Appointment booking is coming soon.")}
        >
          <Plus size={17} />
          New appointment
        </button>
      </section>

      <section className="stat-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article className="stat-card" key={stat.label}>
              <div className="stat-card-top">
                <span className="stat-label">{stat.label}</span>
                <div
                  className="stat-icon"
                  style={{ background: stat.bg, color: stat.color }}
                >
                  <Icon size={20} />
                </div>
              </div>

              <div className="stat-number">{stat.value}</div>

              <div className="stat-note">
                <span className="stat-change">
                  <ArrowUpRight size={13} />
                  {" "}{stat.change}
                </span>
                <span>{stat.note}</span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Appointment activity</h2>
              <p className="panel-subtitle">
                Appointment volume over the last seven days
              </p>
            </div>
            <button className="secondary-button">
              <CalendarDays size={15} />
              This week
            </button>
          </div>

          <div className="panel-body">
            <div className="chart-legend">
              <span>
                <i className="legend-dot legend-blue" />
                Appointments
              </span>
              <span>
                <i className="legend-dot legend-light" />
                Patients
              </span>
            </div>

            <div className="bar-chart">
              <div className="chart-y-labels">
                <span>100</span>
                <span>75</span>
                <span>50</span>
                <span>25</span>
                <span>0</span>
              </div>

              <div className="chart-plot">
                {[100, 75, 50, 25, 0].map((tick) => (
                  <div
                    className="chart-grid-line"
                    style={{ bottom: `${tick}%` }}
                    key={tick}
                  />
                ))}

                <div className="chart-bars">
                  {weeklyActivity.map((item) => (
                    <div className="chart-day" key={item.day}>
                      <div className="chart-bar-pair">
                        <div
                          className="chart-bar chart-bar-primary"
                          style={{
                            height: `${(item.appointments / maxValue) * 88}%`,
                          }}
                          title={`${item.appointments} appointments`}
                        />
                        <div
                          className="chart-bar chart-bar-secondary"
                          style={{
                            height: `${(item.patients / maxValue) * 88}%`,
                          }}
                          title={`${item.patients} patients`}
                        />
                      </div>
                      <span>{item.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Today&apos;s summary</h2>
              <p className="panel-subtitle">Daily activity at a glance</p>
            </div>
            <MoreHorizontal size={21} color="#94a3b8" />
          </div>

          <div className="summary-list">
            <div className="summary-item">
              <div className="summary-icon summary-blue">
                <CalendarCheck size={19} />
              </div>
              <div className="summary-copy">
                <span>Total appointments</span>
                <strong>32</strong>
              </div>
              <span className="summary-tag">Today</span>
            </div>

            <div className="summary-item">
              <div className="summary-icon summary-green">
                <Users size={19} />
              </div>
              <div className="summary-copy">
                <span>Patients checked in</span>
                <strong>18</strong>
              </div>
              <span className="summary-tag">56%</span>
            </div>

            <div className="summary-item">
              <div className="summary-icon summary-purple">
                <Stethoscope size={19} />
              </div>
              <div className="summary-copy">
                <span>Doctors available</span>
                <strong>12</strong>
              </div>
              <span className="summary-tag">On duty</span>
            </div>

            <div className="summary-item">
              <div className="summary-icon summary-orange">
                <Clock3 size={19} />
              </div>
              <div className="summary-copy">
                <span>Pending appointments</span>
                <strong>7</strong>
              </div>
              <span className="summary-tag">Review</span>
            </div>
          </div>
        </article>
      </section>

      <section className="panel appointments-panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Recent appointments</h2>
            <p className="panel-subtitle">
              A quick overview of scheduled patient visits
            </p>
          </div>
          <a href="/appointments" className="text-link">
            View all appointments →
          </a>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Appointment ID</th>
                <th>Doctor</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>
                    <div className="person-cell">
                      <div
                        className="avatar"
                        style={{
                          width: 34,
                          height: 34,
                          background: appointment.color,
                          color: appointment.textColor,
                        }}
                      >
                        {appointment.initials}
                      </div>
                      <div>
                        <div className="person-name">{appointment.name}</div>
                        <div className="person-detail">
                          {appointment.specialty}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{appointment.id}</td>
                  <td>{appointment.doctor}</td>
                  <td>{appointment.time}</td>
                  <td>
                    <span
                      className={`status-badge status-${appointment.status.toLowerCase()}`}
                    >
                      <i className="status-dot" />
                      {appointment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
