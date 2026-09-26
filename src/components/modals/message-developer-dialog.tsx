import React, { useState } from "react";
import { Mail, Send, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

export function MessageDeveloperDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [isSending, setIsSending] = useState(false);

  if (!open) return null;

  const handleSend = () => {
    if (!message.trim()) return;
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      onOpenChange(false);
      toast.success("Message dispatched to luzukodlamini12@gmail.com!");
      setMessage("");
      setSubject("");
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Message Developer</h3>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground">Recipient</label>
            <Input
              disabled
              value="luzukodlamini12@gmail.com"
              className="mt-1 h-8 bg-muted font-mono text-muted-foreground"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground">Subject / Feature Request</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Request new robotic arm archetype or solver..."
              className="mt-1 h-8"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your feedback, hardware requirements, or custom component request..."
              rows={4}
              className="w-full mt-1 p-2 rounded-md border border-input bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!message.trim() || isSending}
            className="gap-1.5 font-bold"
          >
            <Send className="h-3.5 w-3.5" />
            {isSending ? "Sending..." : "Send Feedback"}
          </Button>
        </div>
      </div>
    </div>
  );
}
