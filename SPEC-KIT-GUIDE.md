# 📘 Spec-Kit (SDD) Guide

Welcome to the Spec-Driven Development (SDD) process with **Antigravity**. The numbered commands are designed to help you easily follow the workflow.

---

## 🚀 Core Workflow

Follow these steps in order for each new feature or Phase:

### Step 1: Establish Project Constitution
**Command**: `/1-speckit.constitution`
- **Purpose**: Define architectural principles and code standards (Java 17, Spring Boot, AWS CDK, etc.).
- **When to use**: Only needed once at the start of a project or when there are major changes to general guidelines.

### Step 2: Create Feature Specification
**Command**: `/2-speckit.specify [Feature Description]`
- **Purpose**: I will create a **new Git branch** and a `specs/[branch]/spec.md` file.
- **Content**: Includes User Stories, Functional Requirements, and Acceptance Criteria.
- **Note**: Please carefully read the `spec.md` file to ensure I understand your intent correctly before moving to the next step.

### Step 3: Plan Implementation
**Command**: `/3-speckit.plan [Technology/Architecture]`
- **Purpose**: Convert business specifications into technical design (`plan.md`).
- **Content**: Database selection, API Endpoints, folder structure, and security.

### Step 4: Break Down Task List
**Command**: `/4-speckit.tasks`
- **Purpose**: Automatically convert `plan.md` into a detailed task list in `tasks.md`.
- **Content**: The smallest executable steps, with checkboxes `[x]` for completion.

### Step 5: Execute and Write Code
**Command**: `/5-speckit.implement`
- **Purpose**: I will start writing actual code, creating files and implementing each listed task.
- **Result**: Complete code that follows the original Spec and Plan.

---

## 🛠️ Additional Support Tools

- **`/6-speckit.analyze`**: Check consistency between Spec, Plan, and Tasks (ensures no requirements are missed).
- **`/7-speckit.checklist`**: Generate quality checklists (e.g., checklist for Requirements).
- **`/8-speckit.clarify`**: Activate when requirements are too vague — I will ask you about options A, B, C.
- **`/9-speckit.taskstoissues`**: Push tasks to GitHub Issues (if you have GitHub connected).

---

## 📂 SDD Directory Structure
- **`.specify/`**: Contains the "memory" (Constitution) and templates of the process.
- **`specs/`**: Stores records for each feature. Each subfolder corresponds to 1 branch.
- **`.agent/`**: Contains commands and skills that help me execute the commands above.

---

## 💡 Example: Implementing "Add Member" Feature

Below is the sequence of commands you will enter to work with me:

1. **Specification Step**:
   > **You**: `/2-speckit.specify Build a feature to add new members to the system, including saving email, name, and phone number to a PostgreSQL database.`
   >
   > **Me**: Will create branch `002-add-member` and `spec.md`. You just need to review the Acceptance Criteria in it.

2. **Planning Step**:
   > **You**: `/3-speckit.plan Use Spring Boot JPA for backend, 'members' table in RDS, email is the unique key.`
   >
   > **Me**: Will create `plan.md` listing classes to create (Entity, Repository, Controller) and configuration steps.

3. **Task Breakdown Step**:
   > **You**: `/4-speckit.tasks`
   >
   > **Me**: Automatically creates `tasks.md` with tasks like:
   > - [ ] Create Member.java Entity
   > - [ ] Set up Repository
   > - [ ] Write POST /api/members API endpoint
   > - [ ] Write Unit Test for Controller.

4. **Implementation Step**:
   > **You**: `/5-speckit.implement`
   >
   > **Me**: Starts writing code for each file, runs tests, and marks items complete on the checklist until the entire feature is done.

---

---
*Happy coding with Spec-Kit!*
