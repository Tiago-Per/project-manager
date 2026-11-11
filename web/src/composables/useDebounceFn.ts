import { onScopeDispose } from 'vue'

/** Delays `fn` until `delay` ms pass without new calls. Pending calls are dropped on unmount. */
export function useDebounceFn<Args extends unknown[]>(fn: (...args: Args) => void, delay: number) {
  let timer: ReturnType<typeof setTimeout> | undefined

  function cancel() {
    clearTimeout(timer)
    timer = undefined
  }

  function run(...args: Args) {
    cancel()
    timer = setTimeout(() => {
      timer = undefined
      fn(...args)
    }, delay)
  }

  onScopeDispose(cancel)

  return { run, cancel }
}
