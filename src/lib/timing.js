export function createDebounce(fn, delay = 0) {
  if (typeof fn !== "function") {
    throw new Error("fn must be a function");
  }

  let timerId;
  const debounced = (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      fn(...args);
    }, delay);
  };

  debounced.cancel = () => clearTimeout(timerId);

  return debounced;
}
