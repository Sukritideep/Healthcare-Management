"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, LayoutDashboard, CalendarDays, HeartPulse, LogOut, Menu, X, Users, PackageSearch, Stethoscope, Pill } from "lucide-react";
import { apiFetch } from "../lib/api";

const SessionContext = createContext({ user: null, loading: true });
export const useSession = () => useContext(SessionContext);

const isAuthRoute = (pathname) => pathname === "/login" || pathname === "/register";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (isAuthRoute(pathname)) {
      return;
    }
    let active = true;
    apiFetch("/api/auth/me")
      .then(({ user: currentUser }) => { if (active) setUser(currentUser); })
      .catch((error) => {
        if (!active) return;
        setUser(null);
        if (error.message === "Authentication required.") router.replace("/login");
        else setSessionError(error.message);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [pathname, router]);

  if (isAuthRoute(pathname)) return <>{children}</>;
  if (loading) return <main className="page-content"><p>Checking your session…</p></main>;
  if (!user && sessionError) return <main className="page-content"><p role="alert">Could not connect to the backend: {sessionError}</p><Link href="/login">Go to sign in</Link></main>;
  if (!user) return <main className="page-content"><p>Redirecting to sign in…</p></main>;

  const initials = (user.full_name || user.email).split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
  const logout = async () => {
    try { await apiFetch("/api/auth/logout", { method: "POST" }); }
    finally { setUser(null); router.replace("/login"); router.refresh(); }
  };

  return (
    <SessionContext.Provider value={{ user, loading: false }}>
      <div className="app-shell">
        {mobileOpen && <button className="mobile-overlay" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
        <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
          <div className="brand">
            <div className="brand-icon"><Activity size={25} strokeWidth={2.5} /></div>
            <div><div className="brand-name">MediCare</div><div className="brand-caption">Healthcare Portal</div></div>
            <button className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={20} /></button>
          </div>
          <div className="sidebar-section-label">WORKSPACE</div>
          <nav className="sidebar-nav">
            <Link href="/" className={`nav-item ${pathname === "/" ? "nav-item-active" : ""}`} onClick={() => setMobileOpen(false)}><LayoutDashboard size={19} /><span>Dashboard</span></Link>
            <Link href="/#appointments" className="nav-item" onClick={() => setMobileOpen(false)}><CalendarDays size={19} /><span>Appointments</span></Link>
            {user.role === "admin" && <Link href="/admin/doctors" className={`nav-item ${pathname.startsWith("/admin/doctors") ? "nav-item-active" : ""}`} onClick={() => setMobileOpen(false)}><Users size={19} /><span>Doctors</span></Link>}
            {user.role === "admin" && <Link href="/inventory" className={`nav-item ${pathname === "/inventory" ? "nav-item-active" : ""}`} onClick={() => setMobileOpen(false)}><PackageSearch size={19} /><span>Inventory</span></Link>}
            {user.role === "doctor" && <Link href="/doctor" className={`nav-item ${pathname === "/doctor" ? "nav-item-active" : ""}`} onClick={() => setMobileOpen(false)}><Stethoscope size={19} /><span>Doctor workspace</span></Link>}
            {user.role === "patient" && <Link href="/prescriptions" className={`nav-item ${pathname === "/prescriptions" ? "nav-item-active" : ""}`} onClick={() => setMobileOpen(false)}><Pill size={19} /><span>Prescriptions</span></Link>}
          </nav>
          <div className="sidebar-bottom"><div className="sidebar-help"><div className="help-icon"><HeartPulse size={20} /></div><div><strong>Need assistance?</strong><p>Contact your system administrator.</p></div></div></div>
          <div className="sidebar-footer">
            <div className="avatar avatar-blue">{initials}</div>
            <div className="sidebar-user"><strong>{user.full_name || user.email}</strong><span>{user.role}</span></div>
            <button type="button" className="icon-button" aria-label="Sign out" onClick={logout}><LogOut size={17} /></button>
          </div>
        </aside>
        <div className="main-area">
          <header className="topbar">
            <div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={22} /></button><div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-divider">/</span><strong>{pathname === "/" ? "Dashboard" : "Workspace"}</strong></div></div>
            <div className="topbar-actions"><span className="role-badge">{user.role}</span><div className="topbar-profile"><div className="avatar avatar-light">{initials}</div><div className="topbar-user-info"><strong>{user.full_name || user.email}</strong><span>{user.email}</span></div></div></div>
          </header>
          <main className="page-content">{children}</main>
          <footer className="app-footer"><span>© 2026 MediCare Healthcare Portal</span><span>Healthcare Management System</span></footer>
        </div>
      </div>
    </SessionContext.Provider>
  );
}
