
# Auterity – UI Specs (Next Sprint)

## DevPilot-Tune GPU Selector
- Component: `<GpuSelector />`
- Dropdown menu with options: [NVIDIA A100, L40S, RTX 4090, BYOM]
- Syncs with backend via `/api/gpu/allocate`

## Code Context Viewer
- Component: `<SemanticCodeExplorer />`
- Tree viewer for indexed tokens
- Search bar with auto-complete and token hit map

## Agent Builder UI
- Component: `<AgentOrchestrator />`
- Canvas grid for Porter/Driver mapping
- Click-to-edit roles and assign routing conditions
