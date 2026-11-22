// Initial platform state: completely empty. No demo accounts, shops or products.
// The first person to create an account becomes the administrator (see stores/auth.js).

/** Default map centre: Kampala, Uganda */
export const DEFAULT_CENTER = [0.3476, 32.5825]

export function createSeed() {
  return {
    version: 2,
    users: [],
    shops: [],
    products: [],
    sales: [],
    expenses: [],
    enquiries: [],
    activity: [],
    settings: {
      appName: 'Fastop',
      currency: 'UGX',
      allowShopSignup: true,
      requireShopApproval: true,
      announcement: '',
      mapCenter: DEFAULT_CENTER,
      supportEmail: '',
    },
  }
}
