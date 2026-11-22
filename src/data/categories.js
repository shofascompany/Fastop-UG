export const CATEGORIES = [
  { id: 'electronics', label: 'Electronics', icon: 'smartphone', color: '#6366F1' },
  { id: 'fashion', label: 'Fashion', icon: 'shirt', color: '#EC4899' },
  { id: 'groceries', label: 'Groceries', icon: 'apple', color: '#16A34A' },
  { id: 'beauty', label: 'Beauty', icon: 'lipstick', color: '#DB2777' },
  { id: 'home', label: 'Home & Living', icon: 'sofa', color: '#0EA5E9' },
  { id: 'hardware', label: 'Hardware', icon: 'wrench', color: '#64748B' },
  { id: 'books', label: 'Books & Stationery', icon: 'book', color: '#A16207' },
  { id: 'sports', label: 'Sports', icon: 'ball', color: '#EA580C' },
  { id: 'other', label: 'Other', icon: 'box', color: '#7C3AED' },
]

export const catById = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1]

export const EXPENSE_CATEGORIES = ['Rent', 'Utilities', 'Salaries', 'Stock purchase', 'Transport', 'Marketing', 'Other']

export const PAYMENT_METHODS = ['Cash', 'Mobile money', 'Card', 'Bank transfer']

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'KES', 'UGX', 'TZS', 'NGN', 'ZAR', 'GHS', 'RWF', 'INR']
