"use client"

import { Slide, ToastContainer } from "react-toastify"

/** Mounts React Toastify once for the whole app without making the layout a Client Component. */
export function ToastProvider() {
  return (
    <ToastContainer
      // The bottom corners belong to the chat and design assistant buttons.
      position="top-right"
      autoClose={5000}
      transition={Slide}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss={false}
      theme="light"
    />
  )
}
