# Tailwind CSS Integration

This source includes a checked-in Tailwind CSS 4.1.10 generated utility layer used by the Platform Administration design system. It is intentionally checked in so the application remains deterministic in restricted/offline build environments.

Current generated utilities include the small set used by shared components. In a connected CI environment, replace the generated layer with the normal Tailwind package + Vite/PostCSS pipeline and regenerate from source candidates.
