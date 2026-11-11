import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/** Calls `handler` on any pointer press outside the element in `target`. */
export function useClickOutside(target: Ref<HTMLElement | null>, handler: () => void) {
  function onPointerDown(event: PointerEvent) {
    const element = target.value
    if (element && !element.contains(event.target as Node)) handler()
  }

  onMounted(() => document.addEventListener('pointerdown', onPointerDown))
  onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown))
}
