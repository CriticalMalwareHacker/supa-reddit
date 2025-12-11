"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client"; // Use your client-side supabase util
import { Bell } from "lucide-react"; // Assuming you use lucide icons

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const supabase = createClient();

  // Fetch messages on load
  useEffect(() => {
    const fetchMessages = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (data) {
        setMessages(data);
        setUnreadCount(data.filter((m) => !m.is_read).length);
      }
    };

    fetchMessages();
  }, []);

  const markAsRead = async (msgId: string) => {
    await supabase.from("messages").update({ is_read: true }).eq("id", msgId);
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_read: true } : m));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2">
        <Bell />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border rounded shadow-lg p-2 z-50 text-black">
          <h3 className="font-bold border-b pb-1 mb-1">Inbox</h3>
          {messages.length === 0 ? (
            <p className="text-sm text-gray-500">No new messages</p>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`text-sm p-2 mb-1 rounded cursor-pointer hover:bg-gray-100 ${!msg.is_read ? "bg-blue-50 font-semibold" : ""}`}
                onClick={() => markAsRead(msg.id)}
              >
                {msg.content}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}