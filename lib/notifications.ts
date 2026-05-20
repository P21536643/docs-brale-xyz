"use client"

interface Notification {
  id: string
  type: "success" | "error" | "info"
  title: string
  message: string
  timestamp: string
  read: boolean
}

export function addNotification(type: "success" | "error" | "info", title: string, message: string) {
  if (typeof window === "undefined") return

  const notification: Notification = {
    id: crypto.randomUUID(),
    type,
    title,
    message,
    timestamp: new Date().toISOString(),
    read: false,
  }

  const stored = localStorage.getItem("pi_exchange_notifications")
  let notifications: Notification[] = []

  if (stored) {
    try {
      notifications = JSON.parse(stored)
    } catch {
      notifications = []
    }
  }

  // Add new notification at the beginning
  notifications.unshift(notification)

  // Keep only last 50 notifications
  if (notifications.length > 50) {
    notifications = notifications.slice(0, 50)
  }

  localStorage.setItem("pi_exchange_notifications", JSON.stringify(notifications))

  // Dispatch custom event for notification updates
  window.dispatchEvent(new Event("notificationsUpdated"))
}
