
# Rule: Generating a Task List from a PRD

## Goal

To guide an AI assistant in creating a detailed, step-by-step task list in Markdown format based on an existing Product Requirements Document (PRD). The task list should guide a developer through implementation.

## Output

- **Format:** Markdown (`.md`)
- **Location:** `/.project-management/current-prd/` 
- **Filename:** `tasks-[prd-file-name].md` (e.g., `tasks-prd-user-profile-editing.md`)` 

## Process

1.  **Receive PRD Reference:** The user points the AI to a specific PRD file
2.  **Analyze PRD:** The AI reads and analyzes the functional requirements, user stories, and other sections of the specified PRD.
3.  **Phase 1: Generate Parent Tasks:** Based on the PRD analysis, create the file and generate the main, high-level tasks required to implement the feature. Use your judgement on how many high-level tasks to use. It's likely to be about 5. If the parent task is informed by a referenced file in the PRD (like a html design mockup), make note of the full file path in the task description. Present these tasks to the user in the specified format (without sub-tasks yet). Inform the user: "I have generated the high-level tasks based on the PRD. Ready to generate the sub-tasks? Respond with 'Go' to proceed."
4.  **Wait for Confirmation:** Pause and wait for the user to respond with "Go".
5.  **Phase 2: Generate Sub-Tasks:** Once the user confirms, break down each parent task into smaller, actionable sub-tasks necessary to complete the parent task. Ensure sub-tasks logically follow from the parent task and cover the implementation details implied by the PRD.
6.  **Identify Relevant Files:** Based on the tasks and PRD, identify potential files that will need to be created or modified. List these under the `Relevant Files` section, including corresponding test files if applicable.
7.  **Generate Final Output:** Combine the parent tasks, sub-tasks, relevant files, and notes into the final Markdown structure.
8.  **Save Task List:** Save the generated document to `/.project-management/current-prd/tasks-[prd-file-name].md`, where `[prd-file-name]` matches the base name of the input PRD file (e.g., if the input was `prd-user-profile-editing.md`, the output is `tasks-prd-user-profile-editing.md`).

## Output Format

The generated task list _must_ follow this structure:

```markdown
## Pre-Feature Development Project Tree
- Use command line tools to get current project tree view, ommitting any directory that starts with `.` or verbose nested directories like venv, etc...  
## Relevant Files
- Reference *existing* project files here
### Proposed New Files
- `path/to/potential/file1.ts` - Brief description of why this file is relevant (e.g., Contains the main component for this feature).
- `path/to/file1.test.ts` - Unit tests for `file1.ts`.
- `path/to/another/file.tsx` - Brief description (e.g., API route handler for data submission).
- `path/to/another/file.test.tsx` - Unit tests for `another/file.tsx`.
### Existing Files Modified
- `lib/utils/helpers.ts` - Brief description (e.g., Utility functions needed for calculations).
- `lib/utils/helpers.test.ts` - Unit tests for `helpers.ts`.

### Notes

- **Tech Stack Considerations**: Remember the project uses Next.js 14+ with App Router, TypeScript, Tailwind CSS + DaisyUI, Zustand for state management, React Query for data fetching, NestJS backend with Prisma ORM, and y-websocket for real-time collaboration. Tasks should leverage these technologies appropriately.
- **Component Structure**: For Next.js, components should be placed in `frontend/src/components/` or within app directory structure for page-specific components.
- **API Routes**: Use Next.js API routes (`frontend/src/app/api/`) for frontend API endpoints that proxy to the NestJS backend.
- **Backend Structure**: NestJS modules should be organized in `backend/src/` with proper controllers, services, and DTOs.
- **Database**: Use Prisma ORM for database operations. Update schema in `backend/prisma/schema.prisma` and run migrations.
- **Real-time Features**: Use y-websocket and Yjs for collaborative document editing and real-time sync.
- **State Management**: Use Zustand stores for client-side state and React Query for server state management.
- **Styling**: Use DaisyUI components with Tailwind CSS classes for consistent styling.
- **External APIs**: Leverage Microsoft Graph and Google APIs SDKs for integration features.
- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- `dev_init.sh` - This file is used by the user install dependencies and start backend/frontend for local dev. For tasks that add systems like databases, or third party components that need more nuanced installation above and beyond npm, update this script such that it leads to a full deployment in the local environment.
- `.codex/install.sh` - This file stores the environment initialization script that sets up the sandbox environment for the Codex agent.  Generally, if the codex coding agent needs environment with systems like databases (as set up in `dev_init.sh`) that setup can be added here.
- `frontend/package.json`,`backend/package.json` - For any task that adds new dependencies, update these files.
- Summarize Design and Technology considerations from the PRD not specifically referenced in tasks.

## Tasks

- [ ] 1.0 Parent Task Title
  - [ ] 1.1 [Sub-task description 1.1]
  - [ ] 1.2 [Sub-task description 1.2]
- [ ] 2.0 Parent Task Title
  - [ ] 2.1 [Sub-task description 2.1]
- [ ] 3.0 Parent Task Title (may not require sub-tasks if purely structural or configuration)
*End of document*
```

## Interaction Model

The process explicitly requires a pause after generating parent tasks to get user confirmation ("Go") before proceeding to generate the detailed sub-tasks. This ensures the high-level plan aligns with user expectations before diving into details.

## Target Audience

Assume the primary reader of the task list is a **junior developer** who will implement the feature.