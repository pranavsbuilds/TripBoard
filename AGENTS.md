1. **Implementation Plans**
   - Any generated implementation plan file must include the stage information in its filename.
   - Example: `implementation_plan(Secure Authentication).md`

2. **Artifact Storage**
   - Store all generated artifacts in the `docs` folder.
   - Organize artifacts by category in clearly named subfolders.
   - No need to store `walkthrough.md` files.

3. **UI / Frontend Development**
   - Before creating or modifying frontend UI, generate or reference a preview .html file in/from the `DESIGNS` folder.
   - This file is intended to act as a visual preview and reference for the intended design.
   - Do not write or change UI code until the preview .html file has been explicitly approved by the user.
   - The UI must match the reference .html file.

4. **Clarifying Questions**
   - Ask direct questions in chat.
   - Do not ask clarification questions inside implementation plan files under sections such as "Open Questions" or "User Review Required".

5. **Code Comments**
   - Keep comments minimal and brief.
   - Reduce token usage by avoiding unnecessary explanations.

6. **Execution Approval**
   - Do not execute any implementation plan unless the user explicitly instructs you to do so even in turbo mode .

7. **India-specific UI/Validation Standards**
   - Dates must be in `DD/MM/YYYY` format.
   - A date picker/calendar must be provided.
   - Currency must be shown in rupees.
   - Phone numbers must default to `+91`.
   - A country code picker must be provided it should include a list of all countries.
   - Any other user-specified requirements related to this should be added here in alphabetical order.

8. **Layout** 
   - the layout must be desktop first and mobile friendly.

10. **Windows PowerShell Chaining**
    - Never use `&&` to chain commands in the terminal, as it causes parser errors in older PowerShell versions. Always use `;` to chain sequential commands (e.g., `cd folder ; npm run dev`).

11. **Security** 
    - Refer `"C:\projects\Prebuild Assets"` for security standards. 

13. **Milestone Gates**
    - When a task is broken into named milestones, complete only one milestone at a time.
    - After finishing a milestone, stop, summarize what was done, and explicitly wait for the user to
      say "proceed" or grant permission before starting the next milestone.
    - This rule applies regardless of how the milestones are defined (in a plan artifact, in chat,
      or referenced by the user).
   -  do not generate an implemendation plan while accomplishing a milestone, just proceed
- Milestone Gates — do not chain milestones without user permission. Once "proceed" is received, first verify previous milestone completion through a codebase run, mark it as achieved in the plan (keeping all milestone data/details intact), and then begin the next milestone. Do NOT run browser-based automated tests (even in turbo mode) unless and until the user explicitly instructs you to do so.
- UI approval gate — generate/reference a design .html file before writing any UI code


14. **Inquiry vs. Action**
    - When the user asks an exploratory question (e.g., "what", "why", "how", "where", "when", or "what standard practices"), do NOT edit code immediately.
    - Respond only in text to answer the question or propose a solution.
    - Wait for explicit instruction or permission from the user before applying any code changes.
15. **Git Commit vs. Push Separation**
    - A command or instruction to "commit" strictly means creating a local commit (`git commit`).
    - Never execute `git push` unless the user explicitly instructs to push (e.g., "push", "commit and push").

16. **Solo Developer Workflow & Branching**
    - The `main` branch must remain stable and deployable.
    - Active development occurs on dedicated feature branches: `feature/<task-name>` (e.g., `feature/auth-setup`, `feature/trip-crud`).
    - A single developer owns all features end-to-end across Admin, Employee, and Shared portals.

17. **Development Logs Protocol (`docs/logs/`)**
    - Maintain daily progress logs in `docs/logs/YYYY-MM-DD.md`.
    - Every log entry must include:
      1. Work completed during the session.
      2. Files modified / created.
      3. Open blockers or pending decisions.
      4. Next steps and pending tasks for the next working session.

18. **Architecture Decision Records (`docs/decisions/`)**
    - Any major structural, architectural, or framework choice must be documented in `docs/decisions/ADR-XXX-<title>.md`.
    - Each ADR must specify: Context, Decision, Alternatives Considered, and Consequences.

19. **Tailwind CSS Design Standards**
    - All future styling refactoring and new UI components must adhere to Tailwind CSS utility standards.
    - Standard brand design tokens:
      - `primary-dark`: `#071D3A`
      - `primary-blue`: `#172B4D`
      - `brand-blue`: `#2E5BFF`
      - `bg-ice`: `#EAF5FC`
      - `accent-gold`: `#D4AF37`
      - `status-green`: `#2ECC71`
      - `status-orange`: `#F39C12`
    - Retain card-based elevation and border-radius consistency (`rounded-xl` / `rounded-2xl`).

