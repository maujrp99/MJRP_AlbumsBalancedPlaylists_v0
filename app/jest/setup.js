// Jest setup of the app. The id port is NOT wired here: src/platform/__tests__/wiring.test.ts
// proves that it throws before the app's wiring and works after it, and every other test wires it
// through the app's own module (src/platform/wiring.ts), as the app does at start.
//
// expo-crypto's native module does not exist under Jest; its `randomUUID` is given Node's, which
// returns the same shape (a v4 UUID). On a device it is the native one, unproved until spike S1
// runs there (tasks.md, TASK-07).
jest.mock('expo-crypto', () => ({ randomUUID: () => require('node:crypto').randomUUID() }))
