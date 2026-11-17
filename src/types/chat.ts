export const chatRoles = ["customer", "admin"] as const
export type ChatRole = (typeof chatRoles)[number]

export const conversationStatuses = ["open", "resolved"] as const
export type ConversationStatus = (typeof conversationStatuses)[number]

/** Which team a conversation is for: different people answer each. */
export const departments = ["lucas", "hydrokarts"] as const
export type Department = (typeof departments)[number]
export const departmentInfo: Record<Department, { label: string; topics: string }> = {
  lucas: { label: "Lucas Racing", topics: "Karts, parts and teamwear" },
  hydrokarts: { label: "HydroKarts", topics: "Helmets and customisation" },
}
export function isDepartment(value: unknown): value is Department {
  return typeof value === "string" && (departments as readonly string[]).includes(value)
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderRole: ChatRole
  body: string
  attachmentPath: string | null
  createdAt: string
  /** Client-only: sent optimistically and not yet confirmed by the server. */
  pending?: boolean
  /** Client-only: the send failed and can be retried. */
  failed?: boolean
}

export interface Conversation {
  id: string
  customerId: string
  customerName: string
  customerEmail: string
  status: ConversationStatus
  lastMessageAt: string | null
  lastMessagePreview: string
  lastMessageRole: ChatRole | null
  customerUnreadCount: number
  adminUnreadCount: number
  department: Department
}
