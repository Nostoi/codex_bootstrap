---
description: 'Best practices and patterns for implementing data-testid attributes and E2E testing in Helmsman components'
applyTo: 'frontend/src/components/**/*.tsx'
---

# E2E Testing Patterns & Best Practices

## Data-Testid Implementation Patterns

- **Always verify test expectations first**: Use `grep_search` in `frontend/tests/fixtures/taskData.ts` to find expected data-testid attributes before implementation
- **Systematic component analysis**: Check if data-testid attributes exist with `grep_search` on target component before adding them
- **Preserve existing functionality**: Add data-testid attributes without changing component behavior, styling, or accessibility features
- **Use exact selector names**: Match data-testid values exactly with testSelectors object expectations (e.g., `task-title`, `task-description`, `task-status`)
- **Apply to conditional elements**: Add data-testid to elements that render conditionally to support comprehensive test scenarios
- **Validate implementation**: Use `grep_search` to confirm all expected attributes were added after implementation

## Accessibility-First E2E Testing

• **Fix WCAG violations immediately**: Critical accessibility failures block multiple test suites - prioritize `select-name`, `label` association issues
• **Associate labels properly**: Use `id`/`htmlFor` attributes AND descriptive `aria-label` attributes for form elements
• **Test accessibility compliance**: Run `npx playwright test --grep "WCAG"` to validate fixes before proceeding with other tests
• **Screen reader compatibility**: Add `aria-label` attributes that describe the element's purpose, not just its content

## E2E Test Debugging Patterns

• **Run targeted tests first**: Use `--grep` to test specific functionality before running full suite (e.g., `--grep "dashboard"`)
• **Analyze failure patterns**: Group failures by root cause (missing components, accessibility, selectors) rather than fixing randomly
• **Validate infrastructure gaps**: Many failures indicate missing UI components rather than test issues - distinguish between the two
• **Performance baseline awareness**: Dashboard load times >3s indicate performance issues, not test problems

## Test Architecture Analysis

• **Follow Page Object Model**: Tests expect data-testid attributes in components consumed by Page Object classes in `pageObjects.ts`
• **Hybrid selector strategy**: Tests use data-testid as primary selectors with CSS/text content fallbacks - don't break existing patterns
• **Conditional rendering support**: Ensure data-testid attributes work with component conditional logic (energy badges, deadline displays, etc.)
• **Component-test alignment**: Bridge gaps between sophisticated UI components and basic test expectations through systematic attribute addition
