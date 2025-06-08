# Contributing to Finex Bot

Thank you for considering contributing to Finex Bot! This document outlines the process for contributing to the project and some important guidelines to follow.

## Single Source of Truth

Finex Bot maintains a strict single source of truth policy to ensure documentation consistency:

**IMPORTANT**: All behaviour changes must patch `docs/ground-truth.md` and/or `openapi/finex.yaml`; never re-state specifications in README.md or other documents.

## Development Workflow

1. **Pick a task**: Choose a task from the `/tasks/` directory.
2. **Follow phase lockstep**: Never start tasks from a future phase without an explicit new YAML.
3. **Create a branch**: Use the naming format `phase{N}/T-{XXX}_{description}` (e.g., `phase3/T-041_get_assets`).
4. **Implement**: Make your changes following our coding standards.
5. **Test**: Ensure all tests pass (unit, contract, E2E).
6. **Update docs**: If your changes affect behavior, update both:
   - `docs/ground-truth.md` - for overall system behavior
   - `openapi/finex.yaml` - for API contract changes

## Pull Request Process

1. Ensure all tests pass.
2. Update documentation: `docs/ground-truth.md` and/or `openapi/finex.yaml`.
3. Use clear commit messages following the format: `type(scope): description` (e.g., `feat(api): implement DELETE /themes/:id`).
4. Create a pull request against the `main` branch.
5. Address any feedback from code reviews.

## Coding Standards

- Follow our ESLint and Prettier configurations.
- Run `npm run lint:fix` before committing.
- Ensure no TODOs or console.log statements in production code.
- Add at least one new unit test when fixing a bug.
- Maintain test coverage of at least 80% for lib/services & API routes.

## Definition of Done

For each task, ensure that:

- All referenced tests are green.
- The openapi/finex.yaml is unchanged unless the task explicitly says "modify contract".
- Lint & typecheck passes.
- There are no TODOs or console.log in changed lines.
- At least one new unit test is added when fixing a bug.

## Security Guidelines

- Edge routes must use @prisma/adapter-neon and never fs.
- All mutations must pass zodParse(bodySchema).
- Never store secrets in code – use environment variables only.
- Implement rate-limiting where appropriate.

## Need Help?

If you have questions or need clarification, please open an issue with the prefix "CLARIFICATION NEEDED:" followed by your question.
