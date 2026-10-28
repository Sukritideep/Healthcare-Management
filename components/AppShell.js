
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  LayoutDashboard,
  Users,
  Stethoscope,
  Pill,
  CalendarDays,
  ClipboardList,
  FileText,
  Search,
  History,
  HeartPulse,
  Bell,
  ChevronDown,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const navigation = {
  admin: [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Patients", href: "/patients", icon: Users },
    { label: "Doctors", href: "/doctors", icon: Stethoscope },
    { label: "Medicines", href: "/medicines", icon: Pill },
    { label: "Appointments", href: "/appointments", icon: CalendarDays },
    { label: "Prescriptions", href: "/prescriptions", icon: FileText },
    { label: "Audit Log", href: "/audit-log", icon: History },
  ],
  doctor: [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "My Schedule", href: "/schedule", icon: CalendarDays },
    { label: "Appointments", href: "/appointments", icon: ClipboardList },
    { label: "Consultation", href: "/consultation", icon: Stethoscope },
    { label: "Prescriptions", href: "/prescriptions", icon: FileText },
    { label: "Similar Cases", href: "/similar-cases", icon: Search },
  ],
  patient: [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Appointments", href: "/appointments", icon: CalendarDays },
    { label: "Prescriptions", href: "/prescriptions", icon: FileText },
    { label: "Medical History", href: "/history", icon: HeartPulse },
  ],
};

const roleDetails = {
  admin: { name: "Admin User", title: "Administrator", initials: "AU" },
  doctor: { name: "Dr. Sarah Wilson", title: "Doctor", initials: "SW" },
  patient: { name: "Alex Johnson", title: "Patient", initials: "AJ" },
};

export default function AppShell({ children }) {
  const pathname = usePathname();
  const [role, setRole] = useState("admin");
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = roleDetails[role];
  const isAuthPage =
  pathname === "/login" || pathname === "/register";
  if (isAuthPage) 
   {
    return <>{children}</>;
   }

  const activeNavigation = navigation[role];

  const isActive = (href) =>
    pathname === href ||
    (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <div className="app-shell">
      {mobileOpen && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <Activity size={25} strokeWidth={2.5} />
          </div>
          <div>
            <div className="brand-name">MediCare</div>
            <div className="brand-caption">Healthcare Portal</div>
          </div>
          <button
            className="icon-button mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>

        <nav className="sidebar-nav">
          {activeNavigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${active ? "nav-item-active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={19} strokeWidth={1.9} />
                <span>{item.label}</span>
                {active && <span className="active-indicator" />}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <div className="help-icon">
              <HeartPulse size={20} />
            </div>
            <div>
              <strong>Need assistance?</strong>
              <p>Contact your system administrator.</p>
            </div>
          </div>

          <Link className="nav-item" href="/settings">
            <Settings size={19} />
            <span>Settings</span>
          </Link>
        </div>

        <div className="sidebar-footer">
          <div className="avatar avatar-blue">{user.initials}</div>
          <div className="sidebar-user">
            <strong>{user.name}</strong>
            <span>{user.title}</span>
          </div>
          <LogOut size={17} className="muted-icon" />
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            <div className="breadcrumb">
              <span>Workspace</span>
              <span className="breadcrumb-divider">/</span>
              <strong>
                {activeNavigation.find((item) => isActive(item.href))
                  ?.label || "Dashboard"}
              </strong>
            </div>
          </div>

          <div className="topbar-actions">
            <label className="role-switcher">
              <span>View as</span>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                aria-label="Switch demo role"
              >
                <option value="admin">Admin</option>
                <option value="doctor">Doctor</option>
                <option value="patient">Patient</option>
              </select>
              <ChevronDown size={14} />
            </label>

            <button
              className="icon-button notification-button"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="notification-dot" />
            </button>

            <div className="topbar-profile">
              <div className="avatar avatar-light">{user.initials}</div>
              <div className="topbar-user-info">
                <strong>{user.name}</strong>
                <span>{user.title}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="page-content">{children}</main>

        <footer className="app-footer">
          <span>© 2026 MediCare Healthcare Portal</span>
          <span>Healthcare Management System</span>
        </footer>
      </div>
    </div>
  );
}
