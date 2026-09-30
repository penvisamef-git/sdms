import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  FileText,
  Settings,
  Shield,
  LogOut,
  Users,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Menu,
  X,
  Search,
  ChevronDown,
  ChevronRight,
  Mail,
  Send,
  BarChart,
  PieChart,
  FileBarChart,
  User,
  Lock,
  ChevronLeft,
  Leaf,
  Bell,
} from "lucide-react";
import "./natural.theme.style.css";
import "./natural.color.script";

function NaturalTheme({ component, currentRoute, routeList }) {
  // Find the initial open menu based on current URL
  const getInitialOpenMenu = () => {
    const currentURL = window.location.pathname;
    if (currentURL.endsWith("/") && currentURL.length > 1) {
      currentURL.slice(0, -1);
    }

    for (let row of routeList) {
      if (row.is_show_sidebar && row.child && row.child.length > 0) {
        let hasActiveChild = false;

        row.child?.forEach((rowLevel1) => {
          rowLevel1.forEach((rowlv2) => {
            if (rowlv2.is_show_sidebar) {
              var urlSub = "/" + rowlv2.url;
              var urlRoute = "/" + row.url;
              var urlSubAfterCheck = urlRoute + urlSub;

              if (
                urlSubAfterCheck.endsWith("/") &&
                urlSubAfterCheck.length > 1
              ) {
                urlSubAfterCheck = urlSubAfterCheck.slice(0, -1);
              }

              if (
                currentURL === urlSubAfterCheck ||
                currentURL === urlSubAfterCheck + "/create" ||
                new RegExp(`^${urlSubAfterCheck}/edit/\\d+$`).test(
                  currentURL,
                ) ||
                new RegExp(`^${urlSubAfterCheck}/view/\\d+$`).test(currentURL)
              ) {
                hasActiveChild = true;
              }
            }
          });
        });

        if (hasActiveChild) {
          return row.name;
        }
      }
    }
    return null;
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(getInitialOpenMenu);
  const toggleSubMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  // Close any open submenu
  const closeSubMenu = () => {
    setOpenMenu(null);
  };

  // *************************** Breadcrumb ***************************//
  const getBreadcrumbs = () => {
    const currentURL = window.location.pathname;
    // Remove trailing slash if it exists
    let cleanURL = currentURL;
    if (cleanURL.endsWith("/") && cleanURL.length > 1) {
      cleanURL = cleanURL.slice(0, -1);
    }

    // Check if current route matches any route in routeList
    for (let row of routeList) {
      // Check parent route
      const parentRoute = "/" + row.url;
      if (cleanURL === parentRoute) {
        // Check if route has breadcrumb
        if (row.breadcrumb && row.breadcrumb.length > 0) {
          return row.breadcrumb;
        }
        // Default breadcrumb for parent
        return [{ name: row.name, url: row.url }];
      }

      // Check child routes
      if (row.child && row.child.length > 0) {
        for (let rowLevel1 of row.child) {
          for (let rowlv2 of rowLevel1) {
            const childRoute = "/" + row.url + "/" + rowlv2.url;
            // Check exact match
            if (cleanURL === childRoute) {
              if (rowlv2.breadcrumb && rowlv2.breadcrumb.length > 0) {
                return rowlv2.breadcrumb;
              }
              // Default breadcrumb for child
              return [
                { name: row.name, url: row.url },
                { name: rowlv2.name, url: row.url + "/" + rowlv2.url }
              ];
            }
            
            // Check create route
            if (cleanURL === childRoute + "/create") {
              if (rowlv2.breadcrumb && rowlv2.breadcrumb.length > 0) {
                return rowlv2.breadcrumb;
              }
              return [
                { name: row.name, url: row.url },
                { name: rowlv2.name, url: row.url + "/" + rowlv2.url },
                { name: "Create", url: null }
              ];
            }
            
            // Check edit route
            const editPattern = new RegExp(`^${childRoute}/edit/\\d+$`);
            if (editPattern.test(cleanURL)) {
              if (rowlv2.breadcrumb && rowlv2.breadcrumb.length > 0) {
                return rowlv2.breadcrumb;
              }
              return [
                { name: row.name, url: row.url },
                { name: rowlv2.name, url: row.url + "/" + rowlv2.url },
                { name: "Edit", url: null }
              ];
            }
            
            // Check view route
            const viewPattern = new RegExp(`^${childRoute}/view/\\d+$`);
            if (viewPattern.test(cleanURL)) {
              if (rowlv2.breadcrumb && rowlv2.breadcrumb.length > 0) {
                return rowlv2.breadcrumb;
              }
              return [
                { name: row.name, url: row.url },
                { name: rowlv2.name, url: row.url + "/" + rowlv2.url },
                { name: "View", url: null }
              ];
            }
          }
        }
      }
    }

    // Default breadcrumb for home
    return [{ name: "Home", url: "home" }];
  };

  const breadcrumbs = getBreadcrumbs();

  // *************************** Side bar menu ***************************//
  function activeMenuChecker_withNoChild(row) {
    var isActive = "";

    var currentURL = window.location.pathname;
    // Remove trailing slash if it exists and not just root
    if (currentURL.endsWith("/") && currentURL.length > 1) {
      currentURL = currentURL.slice(0, -1);
    }

    var urlRoute =
      row && typeof row !== "undefined" && row.url ? "/" + row.url : "";
    // Remove trailing slash from route
    if (urlRoute.endsWith("/") && urlRoute.length > 1) {
      urlRoute = urlRoute.slice(0, -1);
    }

    if (currentURL === urlRoute) {
      isActive = "active";
    }

    return isActive;
  }

  function activeMenuChecker_withSubChild(row, row2) {
    var isActive = "";

    var currentURL = window.location.pathname;
    // Remove trailing slash if it exists
    if (currentURL.endsWith("/") && currentURL.length > 1) {
      currentURL = currentURL.slice(0, -1);
    }

    var urlSub =
      row2 && typeof row2 !== "undefined" && row2.url ? "/" + row2.url : "";
    var urlRoute =
      row && typeof row !== "undefined" && row.url
        ? "/" + row.url
        : "" + urlSub;
    var urlSubAfterCheck = urlRoute + urlSub;
    // Remove trailing slash from base URL
    if (urlSubAfterCheck.endsWith("/") && urlSubAfterCheck.length > 1) {
      urlSubAfterCheck = urlSubAfterCheck.slice(0, -1);
    }

    // Check exact match
    if (currentURL === urlSubAfterCheck) {
      isActive = "active";
    }

    // Check /create
    if (currentURL === urlSubAfterCheck + "/create") {
      isActive = "active";
    }

    // Check /edit/:id (any number after /edit/)
    const editPattern = new RegExp(`^${urlSubAfterCheck}/edit/\\d+$`);
    if (editPattern.test(currentURL)) {
      isActive = "active";
    }

    // Check /view/:id (any number after /view/)
    const viewPattern = new RegExp(`^${urlSubAfterCheck}/view/\\d+$`);
    if (viewPattern.test(currentURL)) {
      isActive = "active";
    }

    return isActive;
  }

  function activeMenuChecker_withHolderSubChild(row) {
    var isActive = "";

    var currentURL = window.location.pathname;
    // Remove trailing slash if it exists and not just root
    if (currentURL.endsWith("/") && currentURL.length > 1) {
      currentURL = currentURL.slice(0, -1);
    }

    var urlRoute =
      row && typeof row !== "undefined" && row.url ? "/" + row.url : "";
    // Remove trailing slash from route
    if (urlRoute.endsWith("/") && urlRoute.length > 1) {
      urlRoute = urlRoute.slice(0, -1);
    }

    // Extract only the first segment from current URL
    var currentURLFirstSegment = currentURL.split("/")[1] || "";
    var routeFirstSegment = urlRoute.split("/")[1] || "";

    // Compare only the first segments
    if ("/" + currentURLFirstSegment === "/" + routeFirstSegment) {
      isActive = "active";
    }

    return isActive + " menu-group";
  }

  const sideBarMenuConfiguration = () => {
    var list = [];

    activeMenuChecker_withNoChild();

    routeList.map((row, i) => {
      if (row.is_show_sidebar) {
        if (
          row.child.length === 0 ||
          row.child === null ||
          row.child === undefined
        ) {
          // No Child - Use Link instead of <a>
          list.push(
            <Link
              key={i + "menu"}
              to={row.url ? "/" + row.url : "#"}
              className={activeMenuChecker_withNoChild(row)}
              onClick={closeSubMenu}
            >
              {row.icon}
              <span className="menu-text">{row.name}</span>
            </Link>,
          );
        } else {
          var subMenu = [];

          row.child?.map((rowLevel1, indexlv1) => {
            rowLevel1.map((rowlv2, indexlv2) => {
              if (rowlv2.is_show_sidebar) {
                // Build the full URL path correctly using the parent row's URL
                let fullPath = row.url + "/" + rowlv2.url;

                // Remove any leading/trailing slashes and double slashes
                fullPath = fullPath
                  .replace(/^\/+|\/+$/g, "")
                  .replace(/\/+/g, "/");

                // Add leading slash
                const cleanPath = "/" + fullPath;

                // Submenu items - Use Link instead of <a>
                subMenu.push(
                  <Link
                    key={indexlv1 + indexlv2 + "sub"}
                    to={cleanPath}
                    className={activeMenuChecker_withSubChild(row, rowlv2)}
                  >
                    {rowlv2.icon}
                    <span className="menu-text">{rowlv2.name}</span>
                  </Link>,
                );
              }
            });
          });

          list.push(
            <div
              key={i + "child-with-menu"}
              className={activeMenuChecker_withHolderSubChild(row)}
            >
              <button
                className={`menu-item ${
                  openMenu === row.name ? "menu-open" : ""
                }`}
                onClick={() => toggleSubMenu(row.name)}
              >
                <div className="menu-left">
                  {row.icon}
                  <span className="menu-text">{row.name}</span>
                </div>

                <ChevronDown
                  size={16}
                  className={openMenu === row.name ? "rotate" : ""}
                />
              </button>

              <div
                className={`submenu ${
                  openMenu === row.name ? "submenu-open" : ""
                }`}
              >
                {subMenu.map((row) => {
                  return row;
                })}
              </div>
            </div>,
          );
        }
      }
    });

    return list;
  };

  // Get current year for copyright
  const currentYear = new Date().getFullYear();

  // *************************** View ***************************//
  return (
    <div className="app">
      {/* Mobile Menu Button */}
      <button
        className="mobile-menu"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="logo">
          <div className="logo-icon">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span className="logo-text">Natural</span>
        </div>

        {/* Profile - Compact */}
        <div className="profile">
          <div className="profile-circle">
            <Leaf />
          </div>
          <div className="profile-details">
            <h3>Nature Admin</h3>
            <div className="rating">🌿 4.9</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="nav-menu">
          {sideBarMenuConfiguration()}
        </nav>

        <button className="logout">
          <LogOut size={18} />
          <span className="menu-text">Logout</span>
        </button>
      </aside>

      {/* Main */}
      <main className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <div className="greeting">
              <small>Welcome back</small>
              <h1 className="page-title">
                {breadcrumbs.length > 0 && breadcrumbs[breadcrumbs.length - 1].name}
                <span> Dashboard</span>
              </h1>
            </div>
            {/* Breadcrumb */}
            <div className="breadcrumb-wrapper">
              <div className="breadcrumb">
                {breadcrumbs.map((crumb, index) => (
                  <span key={index}>
                    {index > 0 && <ChevronRight size={14} className="breadcrumb-separator" />}
                    {crumb.url ? (
                      <Link to={"/" + crumb.url} className="breadcrumb-link">
                        {crumb.name}
                      </Link>
                    ) : (
                      <span className="breadcrumb-current">{crumb.name}</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="header-right">
            {/* Search */}
            <div className="search-box">
              <Search size={16} />
              <input placeholder="Search..." />
            </div>
            
            {/* Avatar */}
            <div className="avatar-group">
              <div className="avatar">NA</div>
              <span>Nature</span>
            </div>
          </div>
        </header>

        {/* Content - Scrollable */}
        <div className="content-wrapper">
          {component}
        </div>

        {/* Footer */}
        <footer className="footer">
          <p>&copy; {currentYear} Natural Dashboard — Made with <span className="heart">♥</span> and <span className="heart">🌿</span></p>
        </footer>
      </main>
    </div>
  );
}

export default NaturalTheme;