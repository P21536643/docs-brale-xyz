"use client"

import { useState, useEffect } from "react"
import { Bell, X, CheckCircle, AlertCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Notification {
  id: string
  type: "success" | "error" | "info"
  title: string
  message: string
  timestamp: string
  read: boolean
}

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Load notifications from localStorage
    const stored = localStorage.getItem("pi_exchange_notifications")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setNotifications(parsed)
        setUnreadCount(parsed.filter((n: Notification) => !n.read).length)
      } catch {
        setNotifications([])
      }
    }
  }, [])

  const markAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      localStorage.setItem("pi_exchange_notifications", JSON.stringify(updated))
      setUnreadCount(updated.filter((n) => !n.read).length)
      return updated
    })
  }

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }))
      localStorage.setItem("pi_exchange_notifications", JSON.stringify(updated))
      setUnreadCount(0)
      return updated
    })
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id)
      localStorage.setItem("pi_exchange_notifications", JSON.stringify(updated))
      setUnreadCount(updated.filter((n) => !n.read).length)
      return updated
    })
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-400" />
      case "info":
        return <Info className="w-5 h-5 text-blue-400" />
      default:
        return <Info className="w-5 h-5 text-slate-400" />
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="relative border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center p-0 bg-purple-600 text-white border-0">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <Card className="absolute right-0 mt-2 w-96 max-h-96 overflow-y-auto z-50 border-slate-800 bg-slate-950 shadow-xl">
            <div className="sticky top-0 bg-slate-950 border-b border-slate-800 p-4 z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 mb-1">No notifications</p>
                <p className="text-sm text-slate-500">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-slate-900/50 transition-colors ${
                      !notification.read ? "bg-slate-900/30" : ""
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-white font-medium text-sm">{notification.title}</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeNotification(notification.id)
                            }}
                            className="text-slate-500 hover:text-slate-300 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">{notification.message}</p>
                        <p className="text-xs text-slate-500 mt-2">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
