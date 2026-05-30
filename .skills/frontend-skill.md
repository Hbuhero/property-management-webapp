diff --git a//home/hud/.codex/skills/frontend-design/SKILL.md b//home/hud/.codex/skills/frontend-design/SKILL.md
@@ -2,4 +2,3 @@
 name: frontend-design
-description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
-license: Complete terms in LICENSE.txt
+description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications, especially React apps that have shadcn/ui components available. Generates creative, polished code that avoids generic AI aesthetics while using the existing component system.
 ---
@@ -41,2 +40,12 @@
 
-Remember: You are capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.
\ No newline at end of file
+## Component System
+
+When a project has shadcn/ui components, use them as the default building blocks for interactive UI:
+- Use `Button`, `Input`, `Textarea`, `Label`, `Select`, `Dialog`, `Popover`, `Calendar`, `Tabs`, `Card`, `Table`, `Checkbox`, `Switch`, `RadioGroup`, `DropdownMenu`, `Command`, `Tooltip`, `Sheet`, `Drawer`, `Toast/Sonner`, and related shadcn primitives before writing custom controls.
+- Import from the local project paths, usually `@/components/ui/<component>`; inspect existing files first because names and exports may differ by project.
+- Compose shadcn primitives with domain-specific styling rather than replacing them with native elements. For example, use shadcn `Select` instead of `<select>`, `Dialog` instead of a hand-rolled modal, `Calendar`/date pickers instead of native date inputs when calendar UX matters, and `Button` instead of bare `<button>` for primary actions.
+- Preserve accessibility behavior supplied by Radix/shadcn primitives. Keep labels, focus states, keyboard behavior, disabled states, validation messages, and empty/loading states complete.
+- Customize with class names, layout, motion, and surrounding composition while keeping the primitive API intact. Avoid forking or rewriting shadcn components unless the existing component is broken or cannot support the required interaction.
+- Add missing shadcn dependencies or helper hooks only when imported components require them; keep package changes minimal and verify lockfile conventions for the project.
+
+Remember: You are capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.
