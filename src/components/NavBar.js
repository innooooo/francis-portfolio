import { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar via ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Hamburger Icon */}
      <button
        className="hamburger"
        aria-label="Open menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
        ☰
      </button>

      {/* Overlay */}
      {isOpen && <div className="overlay" onClick={closeSidebar}></div>}

      {/* Sidebar */}
      <nav
        className={`sidebar ${isOpen ? "open" : ""}`}
        role="navigation"
        aria-label="Main Navigation"
      >
         <NavLink
          to="/home"
          viewTransition
          className={({ isActive, isPending }) =>
            isActive
              ? "nav-item active"
              : isPending
              ? "nav-item pending"
              : "nav-item"
          }
          onClick={closeSidebar}
        >
          Home
        </NavLink>

        <NavLink
          to="/about"
          viewTransition
          className={({ isActive, isPending }) =>
            isActive
              ? "nav-item active"
              : isPending
              ? "nav-item pending"
              : "nav-item"
          }
          onClick={closeSidebar}
        >
          About Me
        </NavLink>

        <NavLink
          to="/music"
          viewTransition
          className={({ isActive, isPending }) =>
            isActive
              ? "nav-item active"
              : isPending
              ? "nav-item pending"
              : "nav-item"
          }
          onClick={closeSidebar}
        >
          My Music
        </NavLink>

        <NavLink
          to="/author"
          viewTransition
          className={({ isActive, isPending }) =>
            isActive
              ? "nav-item active"
              : isPending
              ? "nav-item pending"
              : "nav-item"
          }
          onClick={closeSidebar}
        >
          My Book
        </NavLink>

        <NavLink
          to="/contact"
          viewTransition
          className={({ isActive, isPending }) =>
            isActive
              ? "nav-item active"
              : isPending
              ? "nav-item pending"
              : "nav-item"
          }
          onClick={closeSidebar}
        >
          Reach Out
        </NavLink>
      </nav>

      <Outlet />
    </>
  );
};

export default Navbar;
