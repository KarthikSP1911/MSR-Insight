Create a new file named `reference.md` in the root of the project.

Then analyze the entire codebase and generate a complete, structured project summary inside this file.

---

You are a senior software architect and codebase analyst.

Your objective is to fully understand and summarize the provided project so that another AI system (or developer) can immediately work on it without missing context.

Be precise, exhaustive, and avoid assumptions not grounded in the input.

---

## INPUT

<Project Context>
Scan and use the full repository context: all source files, README, configs, documentation, and related artifacts.
</Project Context>

---

## INSTRUCTIONS

1. Parse all available information (including implicit structure from code).
2. Infer missing but necessary context ONLY if strongly implied.
3. Highlight uncertainties explicitly instead of guessing.
4. Maintain strict structure and clarity.
5. Optimize for downstream tasks like:

   * feature development
   * debugging
   * refactoring
   * onboarding new developers

---

## OUTPUT FORMAT (write this into reference.md)

### 1. Project Summary

* Concise description of the system
* Problem it solves
* Target users

### 2. Functional Overview

* List all major features
* Describe behavior and interactions
* Identify entry points (APIs, UI, CLI, etc.)

### 3. Codebase Structure

* Folder/module breakdown
* Purpose of each major file/module
* Dependency relationships

### 4. System Architecture

* High-level architecture (monolith, microservices, etc.)
* Component interaction diagram (describe in text)
* Data flow

### 5. Tech Stack

* Languages, frameworks, libraries
* Runtime environment
* Build tools and package managers

### 6. Key Components Deep Dive

For each critical module:

* Responsibility
* Inputs/outputs
* Internal logic
* Dependencies

### 7. Data Layer

* Data models / schemas
* Storage systems (DB, files, cache)
* Data flow and transformations

### 8. APIs / Interfaces

* Endpoints or exposed functions
* Input/output formats
* Authentication/authorization (if any)

### 9. Execution Flow

* Step-by-step flow of how the system runs
* From initialization to main functionality

### 10. Configuration & Environment

* Environment variables
* Config files
* Required setup

### 11. Known Issues / Gaps

* Missing implementations
* TODOs / placeholders
* Potential bugs or risks

### 12. Assumptions & Uncertainties

* Clearly list anything unclear or inferred

### 13. Extension Points

* Where new features can be added
* Safe areas for modification
* Coupling risks

### 14. Testing & Validation

* Existing tests (if any)
* How to verify correctness
* Suggested test improvements

### 15. Deployment

* Build and run steps
* Deployment model (local, cloud, CI/CD)

---

## OUTPUT STYLE

* Use clear markdown headings and bullet points
* Be dense but readable
* Avoid repetition
* Prefer technical precision over verbosity
* Do NOT include irrelevant explanations

---

## CRITICAL CONSTRAINTS

* Do NOT hallucinate missing files or features
* Do NOT generalize vaguely
* If something is unclear, explicitly state: "Not enough information"

---

## OPTIONAL (IF CODE IS PROVIDED)

Also include:

* Call graph (textual)
* Key algorithms explained step-by-step
* Performance considerations

---

After completion, ensure all content is written and saved in `reference.md`.