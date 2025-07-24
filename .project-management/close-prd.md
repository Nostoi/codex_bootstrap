# Coding Agent Review Instructions

## Purpose
This document provides step-by-step instructions for the coding agent to perform a critical review of the current PRD (Product Requirements Document) and associated tasks, and to take appropriate follow-up actions based on the review.

---

## Steps

1. **Open the Current PRD and Tasks Files**
   - Locate and open the current PRD file(s) in `.project-management/current-prd/prd.*.md`.
   - Locate and open the current tasks file(s) (e.g., `.project-management/current-prd/tasks.*.md`).

2. **Review Changes**
   - Carefully review the changes documented in the PRD and tasks files.
   - Compare these changes against the current codebase to determine if the code accurately reflects the documented requirements and tasks.

3. **Critical Review**
   - Assess whether any additional changes, bug fixes, or improvements are necessary to align the codebase with the PRD and tasks.
   - Verify that the implementation follows the project's tech stack standards:
     - **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS + DaisyUI
     - **State Management**: Zustand for client state, React Query for server state  
     - **Backend**: Node.js with NestJS framework
     - **Database**: Prisma ORM with PostgreSQL (SQLite for development)
     - **Real-time**: y-websocket with Yjs CRDT for collaborative features
     - **External APIs**: Microsoft Graph SDK, Google APIs SDK
     - **Testing**: Jest for both frontend and backend
   - Check that components use DaisyUI classes appropriately and follow Next.js App Router conventions
   - Verify NestJS modules are properly structured with controllers, services, and DTOs
   - Ensure Prisma models and migrations are correctly implemented
   - Validate real-time collaboration features use y-websocket and Yjs appropriately

4. **Take Action Based on Review**
   - **If changes are deemed necessary:**
    - Make the changes needed.
    - Edit the relevant `tasks.*.md` file to add a follow-up review task describing the  changes made.
   - **If no further changes are needed:**
     - Move all files from `.project-management/current-prd/` to `.project-management/closed-prd/` to indicate the PRD has been reviewed and closed.

---

## Notes
- Ensure all actions are logged or tracked as appropriate for project management and traceability.
- If you encounter any ambiguity or missing information, escalate for clarification before proceeding.
