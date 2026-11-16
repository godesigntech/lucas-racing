"use client"

import dynamic from "next/dynamic"

/**
 * The chat, downloaded only when a signed-in customer is shown it. Imported directly in
 * the layout, its code (and the Supabase and form libraries it uses) would load on every
 * page for every visitor, guests included.
 */
export const CustomerChatLazy = dynamic(() => import("./customer-chat").then((module) => module.CustomerChat), { ssr: false })
