import React, { useEffect, useState } from "react";
import { Routes, Route, BrowserRouter, Navigate } from "react-router-dom";
import ErrorComponent from "../page/error/error.component";
import LoginComponent from "../page/login/login.component";
import ThemeComponent from "../page/theme/default/theme.component";
import RouteScript from "./route.script";
import Auth from "../page/util/auth";
import { filterRoutes, refreshLoginRole } from "../page/util/permission";

function RouteComponent() {
  //**************** Declaration ****************//
  const routeScript = new RouteScript();
  const auth = new Auth();

  // Keep the saved role in sync with the server (an admin may have changed it); re-render when it changes
  const [, setRoleVersion] = useState(0);
  useEffect(() => {
    if (!auth.getClientLogin()) return;
    refreshLoginRole(auth).then((changed) => {
      if (changed) setRoleVersion((v) => v + 1);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //**************** Route Configuration ****************//

  // ✅ Public landing route "/" — redirect to /home if logged in
  const routePublic = () => {
    const isLogin = auth.getClientLogin();

    return [
      <Route
        key="/"
        path="/"
        element={
          isLogin
            ? <Navigate to="/home" replace />
            : <LoginComponent />
        }
      />,
    ];
  };

  // ✅ Login route — redirect to /home if already logged in
  const routeLogin = () => {
    const isLogin = auth.getClientLogin();

    return (
      <Route
        key="/login"
        path="/login"
        element={
          isLogin
            ? <Navigate to="/home" replace />
            : <LoginComponent />
        }
      />
    );
  };

  // ✅ 404 fallback
  const routeError = () => {
     const isLogin = auth.getClientLogin();
    return <Route key="404" path="*" element={
          isLogin
            ? <Navigate to="/home" replace />
            : <LoginComponent />
        } />;
  };

  // ✅ Dashboard routes with auth guard
  const routeDashboardWithTheme = () => {
    const isLogin = auth.getClientLogin();

    // ─────────────────────────────────────────────────────────────
    // 🚫 No session → redirect everything to /login
    // ─────────────────────────────────────────────────────────────
    if (!isLogin) {
      return [
        <Route
          key="redirect-unauth"
          path="*"
          element={<Navigate to="/login" replace />}
        />,
      ];
    }

    // ─────────────────────────────────────────────────────────────
    // ✅ Session exists → build dashboard routes
    // ─────────────────────────────────────────────────────────────
    const listOfRoute = [];

    // only the screens this user's role may open — anything else falls through to the 404 redirect (/home)
    const allowedRoutes = filterRoutes(routeScript.routeDashboard(), isLogin);

    allowedRoutes.forEach((row) => {
      if (!row.is_can_access_route) return;

      // ---- Level 0 (top-level route) ----
      if (!row.child || row.child.length === 0) {
        listOfRoute.push(
          <Route
            key={row.url}
            path={row.url}
            element={
              <ThemeComponent
                component={row.component}
                currentRoute={row}
                routeList={allowedRoutes}
              />
            }
          />,
        );
      } else {
        // ---- Level 1 + Level 2 (nested) ----
        row.child?.forEach((rowLevel1) => {
          rowLevel1.forEach((rowlv2) => {
            if (!rowlv2.is_can_access_route) return;

            let typeChecker = "";
            if (rowlv2.type === "create") typeChecker = "/create";
            else if (rowlv2.type === "view") typeChecker = "/view";
            else if (rowlv2.type === "edit") typeChecker = "/edit";

            const fullPath = row.url + "/" + rowlv2.url + typeChecker;

            listOfRoute.push(
              <Route
                key={fullPath}
                path={fullPath}
                element={
                  <ThemeComponent
                    component={rowlv2.component}
                    currentRoute={rowlv2}
                    routeList={allowedRoutes}
                  />
                }
              />,
            );
          });
        });
      }
    });

    return listOfRoute;
  };

  // **************** Design ****************//
  return (
    <BrowserRouter>
      <Routes>
        {routeLogin()}
        {routePublic()}
        {routeDashboardWithTheme()}
        {routeError()}
      </Routes>
    </BrowserRouter>
  );
}

export default RouteComponent;