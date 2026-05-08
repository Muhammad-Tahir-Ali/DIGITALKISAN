// Web stub for react-native-worklets-core
// This native-only package uses JSI/TurboModules which don't exist on web.
// Reanimated on web doesn't need worklets-core; it uses its own web runtime.

export const Worklets = {
  createRunInJsFn: (fn: (...args: any[]) => any) => fn,
  createRunInContextFn: (fn: (...args: any[]) => any) => fn,
  getCurrentThreadId: () => 0,
  defaultContext: {
    addDecorator: () => {},
  },
};

export default {};
