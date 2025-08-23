React hooks come with two essential rules that must be followed to ensure your components work correctly:

- Only call hooks at the top level - Never call hooks inside loops, conditions, or nested functions. Hooks need to be called in the same order on every render to maintain their state properly. Watch out for conditional early returns, which can also create conditional hook calls.
- Only call hooks from React functions - Call hooks from React functional components or from custom hooks. Don't call them from regular JavaScript functions.

These rules exist because React relies on the order of hook calls to correctly associate state with each hook. Breaking these rules can lead to bugs that are difficult to track down, such as state becoming unpredictable or effects running at the wrong time.
