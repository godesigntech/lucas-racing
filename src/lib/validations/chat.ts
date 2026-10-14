import { z } from "zod"

import { conversationStatuses } from "@/types/chat"

export const CHAT_MESSAGE_MAX = 2000

// Attachments live at "<customer id>/<uuid>.<ext>" in the chat-attachments bucket.
const attachmentPath = z
  .string()
  .regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp|gif)$/, "That attachment isn't valid.")

export const chatMessageSchema = z
  .object({
    id: z.uuid(),
    body: z.string().trim().max(CHAT_MESSAGE_MAX, `Keep messages under ${CHAT_MESSAGE_MAX.toLocaleString("en-GB")} characters`),
    attachmentPath: attachmentPath.nullable(),
  })
  .refine((value) => value.body.length > 0 || value.attachmentPath, {
    message: "Write a message or add a photo.",
    path: ["body"],
  })
export type ChatMessageValues = z.infer<typeof chatMessageSchema>

export const conversationStatusSchema = z.enum(conversationStatuses)
