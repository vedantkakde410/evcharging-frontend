// Imperative navigation for code outside React components (AuthContext,
// services/api.js) - AuthProvider is mounted above <BrowserRouter> in
// main.jsx, so it can't call useNavigate() itself. A tiny bridge component
// mounted inside the router (see App.jsx's NavigationBridge) captures the
// real navigate function here once; everything else calls navigate() below
// without needing to be a component.
let navigateFn = null;

export function setNavigate(fn) {
  navigateFn = fn;
}

export function navigate(path, options) {
  if (navigateFn) {
    navigateFn(path, options);
  } else {
    window.location.href = path;
  }
}
