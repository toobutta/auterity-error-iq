export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

// Semantic z-index aliases
export const semanticZIndex = {
  // Navigation elements
  header: zIndex.sticky,
  navbar: zIndex.sticky,
  sidebar: zIndex.docked,
  footer: zIndex.base,
  
  // Interactive elements
  dropdown: zIndex.dropdown,
  select: zIndex.dropdown,
  menu: zIndex.dropdown,
  
  // Overlay elements
  backdrop: zIndex.overlay,
  drawer: zIndex.overlay + 10,
  dialog: zIndex.modal,
  modal: zIndex.modal,
  
  // Notification elements
  alert: zIndex.toast,
  notification: zIndex.toast,
  toast: zIndex.toast,
  
  // Helper elements
  tooltip: zIndex.tooltip,
  popover: zIndex.popover,
};