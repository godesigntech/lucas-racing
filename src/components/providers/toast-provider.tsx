"use client"

import { Slide, ToastContainer } from "react-toastify"

/** Mounts React Toastify once for the whole app without making the layout a Client Component. */
export function ToastProvider() {
  return (
    <ToastContainer
      position="bottom-right"
      autoClose={5000}
      transition={Slide}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss={false}
      theme="light"
    />
  )
}
