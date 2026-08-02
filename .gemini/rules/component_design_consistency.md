# Component Design & UX Pattern Consistency Rule

Whenever any component, screen, popup/modal, tab bar, card, or interaction pattern is created, modified, or reused across the app:
1. **Reuse Existing Design & UX Patterns**: If a component pattern (such as the animated tab switcher with sliding pill indicator from `HistoryScreen`, standard popup/modal structures, header badges, card containers, or action buttons) already exists in the app, you MUST reuse the exact same visual design, styling tokens, animations, and UX interaction patterns.
2. **Unified Aesthetics & Behavior**: Avoid creating ad-hoc, unstyled, or inconsistent variations of tabs, modals, popups, or cards. Shared components across screens must maintain identical styling (e.g. dark translucent surfaces `rgba(255, 255, 255, 0.04)`, cyan `#38BDF8` active glows/indicators, `#0F172A` popup dialog backgrounds with `borderRadius: 24`, and fluid spring animations).
