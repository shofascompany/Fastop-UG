import { reactive } from 'vue'

export const toasts = reactive([])

export function toast(message, type = 'success') {
  const id = Math.random().toString(36).slice(2)
  toasts.push({ id, message, type })
  setTimeout(() => {
    const i = toasts.findIndex((t) => t.id === id)
    if (i > -1) toasts.splice(i, 1)
  }, 3200)
}
