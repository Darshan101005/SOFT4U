import * as React from "react"

const noopSubscribe = () => () => {}

/**
 * True once the component is rendering in the browser (false during SSR and hydration).
 * Use it to defer UI that depends on localStorage/sessionStorage without a setState-in-effect.
 */
export function useHydrated() {
  return React.useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  )
}

/** Reads a sessionStorage key; returns undefined on the server, null if unset or unreadable. */
export function useSessionStorageValue(key: string) {
  return React.useSyncExternalStore<string | null | undefined>(
    noopSubscribe,
    () => {
      try {
        return window.sessionStorage.getItem(key)
      } catch {
        return null
      }
    },
    () => undefined
  )
}
