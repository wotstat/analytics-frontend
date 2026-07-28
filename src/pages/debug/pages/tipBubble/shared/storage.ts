import { TIP_BUBBLE_STORAGE_PREFIX } from '@/shared/uiKit/tipBubble/useTipBubble'

// Формат ключа собран из useTipBubble.ts (`${TIP_BUBBLE_STORAGE_PREFIX}:${key}`) —
// наружу экспортирован только префикс, сама функция сборки ключа приватная.
export function resetBubbleKeys(...keys: string[]) {
  for (const key of keys) localStorage.removeItem(`${TIP_BUBBLE_STORAGE_PREFIX}:${key}`)
}
