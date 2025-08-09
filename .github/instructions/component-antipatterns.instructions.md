---
description: 'Common mistakes and anti-patterns to avoid when implementing data-testid attributes and accessibility features in React components'
applyTo: 'frontend/src/components/**/*.tsx'
---

# Component Implementation Anti-Patterns

## Data-Testid Mistakes

- **Never assume data-testid exists**: Always check actual component implementation before relying on test selectors
- **Don't modify existing selectors**: Preserve CSS classes and existing test patterns when adding data-testid attributes
- **Avoid breaking conditional rendering**: Test data-testid attributes work with all component states (loading, error, different props)
- **Don't duplicate efforts**: Use `grep_search` to verify which components already have data-testid before implementation

## Accessibility Implementation Errors

- **Never skip form element labels**: Select elements MUST have either proper label association OR aria-label attributes
- **Don't rely on visual labels alone**: Screen readers need programmatic association through `id`/`htmlFor` or `aria-label`
- **Avoid accessibility-breaking changes**: Maintain existing accessibility features when adding test attributes
- **Don't ignore WCAG test failures**: Critical accessibility violations block entire test suites - fix immediately

## File Analysis Patterns

- **Always check current file state**: Use `read_file` to verify manual changes before making additional edits
- **Verify component structure**: Read component implementation to understand conditional rendering before adding attributes
- **Check test infrastructure**: Examine `testSelectors` object in test fixtures to understand expected selector patterns
- **Validate after changes**: Use `grep_search` to confirm implementations match test expectations

## Systematic Implementation Approach

- **Start with gap analysis**: Identify missing data-testid attributes by comparing test expectations with component reality
- **Prioritize by impact**: Fix accessibility blockers and high-usage components first
- **Implement systematically**: Add attributes to related elements in logical groups (all task metadata, all filter controls)
- **Validate incrementally**: Test changes immediately rather than accumulating multiple component changes

## Related Instructions

See [e2e-testing-patterns.instructions.md](./e2e-testing-patterns.instructions.md) for best practices and positive patterns to follow.
