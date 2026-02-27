# CLAUDE.md

This file provides guidance for AI assistants (Claude Code and similar tools) working in this repository.

## Repository Overview

This is a newly initialized Git repository. This file will be updated as the project evolves.

- **Remote**: `http://local_proxy@127.0.0.1:33269/git/khan5217/Claude`
- **Default branch**: `main` (or as configured)
- **Commit signing**: SSH-based (`/home/claude/.ssh/commit_signing_key.pub`)

---

## Git Workflow

### Branch Naming

All AI assistant branches must follow this pattern:

```
claude/<task-description>-<session-id>
```

Example: `claude/claude-md-mm3j4h1m80l7ui69-JaVHS`

### Commit Convention

Use clear, descriptive commit messages in the imperative mood:

```
Add user authentication module
Fix off-by-one error in pagination logic
Refactor database connection pooling
```

Commits are GPG-signed via SSH. Never skip signing (`--no-gpg-sign`) unless explicitly instructed.

### Push Workflow

```bash
# Always set upstream on first push
git push -u origin <branch-name>
```

If a push fails due to a network error, retry with exponential backoff:
- Wait 2s → retry
- Wait 4s → retry
- Wait 8s → retry
- Wait 16s → retry

**Never force-push to `main` or shared branches without explicit permission.**

### Pull / Fetch

Prefer fetching specific branches:

```bash
git fetch origin <branch-name>
git pull origin <branch-name>
```

---

## Development Guidelines

### Before Making Changes

1. Read the relevant files before editing them.
2. Understand the existing code structure and conventions.
3. Keep changes minimal and focused — only modify what is directly required.

### Code Quality

- Avoid over-engineering. Implement the simplest solution that satisfies the requirement.
- Do not add error handling, fallbacks, or abstractions for hypothetical future scenarios.
- Do not add docstrings, comments, or type annotations to code you didn't touch.
- Only add comments where the logic is not self-evident.
- Remove dead code rather than commenting it out.

### Security

- Never introduce command injection, XSS, SQL injection, or other OWASP Top 10 vulnerabilities.
- Validate input only at system boundaries (user input, external APIs). Trust internal code.
- Do not commit secrets, credentials, or `.env` files.

### File Management

- Prefer editing existing files over creating new ones.
- Do not create documentation files unless explicitly requested.

---

## Risky Actions — Confirm Before Proceeding

The following actions require explicit user confirmation:

| Action | Why |
|--------|-----|
| `git push --force` | Can overwrite upstream history |
| `git reset --hard` | Discards uncommitted work |
| `rm -rf` / file deletion | Irreversible data loss |
| Dropping database tables | Destructive to shared data |
| Modifying CI/CD pipelines | Affects all contributors |
| Posting to external services | Visible to others |

---

## Project Structure

> This section will be updated as the project is built out.

```
/
├── CLAUDE.md          # This file
└── ...                # Project files to be added
```

---

## Testing

> Document the test framework, commands, and conventions here once established.

Common patterns (update as appropriate):

```bash
# Run all tests
npm test          # Node.js / JavaScript
pytest            # Python
cargo test        # Rust
go test ./...     # Go
```

---

## Build & Run

> Document build steps and run commands here once established.

---

## Environment Setup

> Document required environment variables, tooling, and setup steps here once established.

---

## Updating This File

Keep this file up to date as the project evolves. Update it when:

- New frameworks, languages, or major dependencies are added
- Build or test commands change
- New conventions or code style rules are adopted
- The directory structure changes significantly
