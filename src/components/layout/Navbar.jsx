import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const nav = "text-slate-600 hover:text-green-600 transition font-medium";

  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    setMobileOpen(false);
    navigate("/");
    toast.success("Logged out");
  }

  const navLinks = (
    <>
      <NavLink className={nav} to="/" onClick={() => setMobileOpen(false)}>
        Home
      </NavLink>

      <NavLink className={nav} to="/history" onClick={() => setMobileOpen(false)}>
        History
      </NavLink>

      {user?.role === "OWNER" && (
        <NavLink className={nav} to="/owner" onClick={() => setMobileOpen(false)}>
          Dashboard
        </NavLink>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between">

        <Link
          to="/"
          className="flex items-center gap-2 text-2xl font-bold text-green-600"
        >
          <Zap size={28} />
          EVCharge
        </Link>

        <nav className="hidden md:flex gap-8">{navLinks}</nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="hidden items-center gap-3 md:flex">
              <span className="text-sm text-slate-500">Hi, {user.name}</span>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          ) : (
            <div className="hidden gap-3 md:flex">
              <Button variant="outline" render={<Link to="/login" />}>
                Login
              </Button>

              <Button
                className="bg-green-600 hover:bg-green-700"
                render={<Link to="/register" />}
              >
                Register
              </Button>
            </div>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" className="md:hidden" />}
            >
              <Menu />
              <span className="sr-only">Open menu</span>
            </SheetTrigger>

            <SheetContent>
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-6 px-4">
                <div className="flex flex-col gap-4">{navLinks}</div>

                {isAuthenticated ? (
                  <div className="flex flex-col gap-3 border-t pt-4">
                    <span className="text-sm text-slate-500">Hi, {user.name}</span>
                    <Button variant="outline" onClick={handleLogout}>
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 border-t pt-4">
                    <Button
                      variant="outline"
                      render={<Link to="/login" />}
                      onClick={() => setMobileOpen(false)}
                    >
                      Login
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      render={<Link to="/register" />}
                      onClick={() => setMobileOpen(false)}
                    >
                      Register
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
