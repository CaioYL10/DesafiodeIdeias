function createMotionController(gsap, prefersReducedMotion) {
  const managementRoutes = new Set(['/clientes', '/tarefas', '/oportunidades', '/triagem', '/acoes']);
  let previousRoute = null;
  let previousModal = null;
  return (root, route, modal) => {
    const routeChanged = route !== previousRoute;
    const modalChanged = modal && modal !== previousModal;
    const switchingManagementTabs = managementRoutes.has(previousRoute) && managementRoutes.has(route);
    previousRoute = route;
    previousModal = modal;
    if (!gsap || prefersReducedMotion()) return;
    if (routeChanged) {
      const page = root.querySelector(switchingManagementTabs ? '.tabs + section' : 'main, .crm-home, .public-home, .login-page');
      if (page) gsap.from(page, { opacity: 0, y: 12, duration: 0.34, ease: 'power2.out', clearProps: 'opacity,transform' });
    }
    if (modalChanged) {
      const dialog = root.querySelector('.modal');
      if (dialog) gsap.from(dialog, { opacity: 0, y: 14, scale: 0.985, duration: 0.28, ease: 'power2.out', clearProps: 'opacity,transform' });
    }
  };
}
if (typeof module !== 'undefined' && module.exports) module.exports = { createMotionController };
