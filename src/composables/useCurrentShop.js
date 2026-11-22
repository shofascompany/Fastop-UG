import { computed } from 'vue'
import { useDb } from '@/stores/db'
import { useAuth } from '@/stores/auth'

/** The shop the shop interface is working on: the owner's shop, or the one an admin picked. */
export function useCurrentShop() {
  const db = useDb()
  const auth = useAuth()
  return computed(() => {
    const u = auth.user
    if (!u) return null
    if (u.role === 'shop') return db.shops.find((s) => s.ownerId === u.id) || null
    if (u.role === 'admin') return db.shops.find((s) => s.id === auth.adminShopId) || db.shops[0] || null
    return null
  })
}
