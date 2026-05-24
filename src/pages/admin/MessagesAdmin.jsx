import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ContactSubmission from '@/entities/ContactSubmission';
import { authedJson } from '@/lib/authedFetch';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Trash2, Mail, Phone, Calendar, Eye, Printer, Download,
  Reply, Send,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const statusColors = {
  new: 'bg-green-500',
  read: 'bg-blue-500',
  replied: 'bg-purple-500',
  archived: 'bg-gray-400',
};

// ── Printable message view ────────────────────────────────────
function printMessage(m) {
  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Message from ${m.name}</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; color: #111; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        .meta { color: #555; font-size: 14px; margin-bottom: 20px; }
        .field { margin-bottom: 12px; }
        .label { font-weight: bold; font-size: 13px; color: #333; }
        .value { font-size: 15px; margin-top: 2px; }
        .message-box { background: #f5f5f5; padding: 16px; border-radius: 8px; white-space: pre-wrap; font-size: 15px; line-height: 1.6; }
        .footer { margin-top: 40px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 12px; }
      </style>
    </head>
    <body>
      <h1>Message from ${m.name}</h1>
      <div class="meta">Received: ${m.created_at ? format(new Date(m.created_at), 'PPP p') : 'Unknown'} &nbsp;|&nbsp; Status: ${m.status}</div>
      <div class="field"><div class="label">Email</div><div class="value"><a href="mailto:${m.email}">${m.email}</a></div></div>
      ${m.phone ? `<div class="field"><div class="label">Phone</div><div class="value">${m.phone}</div></div>` : ''}
      ${m.event_type ? `<div class="field"><div class="label">Event Type</div><div class="value">${m.event_type}</div></div>` : ''}
      ${m.event_date ? `<div class="field"><div class="label">Event Date</div><div class="value">${m.event_date}</div></div>` : ''}
      <div class="field"><div class="label">Message</div><div class="message-box">${m.message}</div></div>
      <div class="footer">BalloonCraft KC — Admin Panel</div>
    </body>
    </html>
  `);
  win.document.close();
  win.print();
}

// ── Download as text file ─────────────────────────────────────
function downloadMessage(m) {
  const lines = [
    `Message from: ${m.name}`,
    `Received: ${m.created_at ? format(new Date(m.created_at), 'PPP p') : 'Unknown'}`,
    `Status: ${m.status}`,
    ``,
    `Email: ${m.email}`,
    m.phone ? `Phone: ${m.phone}` : null,
    m.event_type ? `Event Type: ${m.event_type}` : null,
    m.event_date ? `Event Date: ${m.event_date}` : null,
    ``,
    `--- Message ---`,
    m.message,
    ``,
    `--- BalloonCraft KC Admin Panel ---`,
  ].filter(l => l !== null).join('\n');

  const blob = new Blob([lines], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `message-${m.name.replace(/\s+/g, '-').toLowerCase()}-${m.id?.slice(0, 8)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Message detail dialog ─────────────────────────────────────
function MessageDialog({ message: m, onClose, onStatusChange, onDelete }) {
  const [replyBody, setReplyBody] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replySent, setReplySent] = useState(false);
  const [replyError, setReplyError] = useState('');

  if (!m) return null;

  const handleReply = async () => {
    if (!replyBody.trim()) return;
    setReplySending(true);
    setReplyError('');
    try {
      await authedJson('/api/send-reply', {
        method: 'POST',
        body: JSON.stringify({
          to_name: m.name,
          to_email: m.email,
          reply_body: replyBody,
          original_message: m.message,
        }),
      });
      onStatusChange(m.id, 'replied');
      setReplySent(true);
      toast.success(`Reply sent to ${m.email}`);
    } catch (err) {
      setReplyError(err.message);
      toast.error('Failed to send reply: ' + err.message);
    } finally {
      setReplySending(false);
    }
  };

  return (
    <Dialog open={!!m} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-xl">{m.name}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {m.created_at ? format(new Date(m.created_at), 'PPP p') : ''}
              </p>
            </div>
            <Badge className={`${statusColors[m.status]} text-white text-xs flex-shrink-0`}>{m.status}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/30 rounded-xl p-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Email</p>
              <a href={`mailto:${m.email}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> {m.email}
              </a>
            </div>
            {m.phone && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Phone</p>
                <a href={`tel:${m.phone}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {m.phone}
                </a>
              </div>
            )}
            {m.event_type && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Event Type</p>
                <p className="text-sm capitalize">{m.event_type.replace('_', ' ')}</p>
              </div>
            )}
            {m.event_date && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Event Date</p>
                <p className="text-sm flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {m.event_date}</p>
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Message</p>
            <div className="bg-muted/40 rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap">{m.message}</div>
          </div>

          {/* Reply composer */}
          <div className="border rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2"><Reply className="w-4 h-4" /> Reply to {m.name}</p>
            {replySent ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-green-700 font-semibold">✓ Reply sent to {m.email}</p>
                <button onClick={() => { setReplySent(false); setReplyBody(''); }} className="text-xs text-green-600 underline mt-2">Send another reply</button>
              </div>
            ) : (
              <>
                <Textarea
                  rows={5}
                  value={replyBody}
                  onChange={e => setReplyBody(e.target.value)}
                  placeholder={`Hi ${m.name},\n\nThank you for reaching out to BalloonCraft KC!\n\n`}
                  className="text-sm"
                />
                {replyError && <p className="text-xs text-red-500">{replyError}</p>}
                <Button
                  onClick={handleReply}
                  disabled={!replyBody.trim() || replySending}
                  className="w-full"
                >
                  {replySending
                    ? <><span className="animate-spin mr-2">⏳</span> Sending...</>
                    : <><Send className="w-4 h-4 mr-2" /> Send Reply to {m.email}</>
                  }
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  The reply will be sent directly from BalloonCraft KC — no email app needed.
                </p>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
            <Select value={m.status} onValueChange={v => onStatusChange(m.id, v)}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => printMessage(m)}>
              <Printer className="w-3.5 h-3.5 mr-1" /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadMessage(m)}>
              <Download className="w-3.5 h-3.5 mr-1" /> Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive ml-auto"
              onClick={() => { onDelete(m.id); onClose(); }}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function MessagesAdmin() {
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState(null);

  const { data: messages = [] } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: () => ContactSubmission.list('-created_at'),
    initialData: [],
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => ContactSubmission.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      // Refresh selected message if open
      setSelectedMessage(prev => prev ? { ...prev, ...arguments[0]?.data } : prev);
      toast.success('Updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => ContactSubmission.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      toast.success('Deleted');
    },
  });

  const handleStatusChange = (id, status) => {
    updateMutation.mutate({ id, data: { status } });
    setSelectedMessage(prev => prev?.id === id ? { ...prev, status } : prev);
  };

  const handleOpen = (m) => {
    setSelectedMessage(m);
    // Auto-mark as read when opened
    if (m.status === 'new') {
      updateMutation.mutate({ id: m.id, data: { status: 'read' } });
      setSelectedMessage({ ...m, status: 'read' });
    }
  };

  const newCount = messages.filter(m => m.status === 'new').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl">Messages</h1>
          {newCount > 0 && (
            <p className="text-sm text-green-600 font-semibold mt-1">
              {newCount} new {newCount === 1 ? 'message' : 'messages'} waiting
            </p>
          )}
        </div>
      </div>

      {messages.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No messages yet.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {messages.map(m => (
            <Card
              key={m.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${m.status === 'new' ? 'border-green-300 bg-green-50/30' : ''}`}
              onClick={() => handleOpen(m)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleOpen(m);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Open message from ${m.name}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold truncate">{m.name}</h3>
                      <Badge className={`${statusColors[m.status]} text-white text-xs flex-shrink-0`}>{m.status}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" aria-hidden="true" /> {m.email}</span>
                      {m.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" aria-hidden="true" /> {m.phone}</span>}
                      {m.event_type && <span className="capitalize">{m.event_type.replace('_', ' ')}</span>}
                      {m.event_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" aria-hidden="true" /> {m.event_date}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{m.message}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {m.created_at ? format(new Date(m.created_at), 'MMM d, p') : ''}
                    </p>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="View" aria-label={`View message from ${m.name}`} onClick={() => handleOpen(m)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Print" aria-label={`Print message from ${m.name}`} onClick={() => printMessage(m)}>
                        <Printer className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Download" aria-label={`Download message from ${m.name}`} onClick={() => downloadMessage(m)}>
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Delete"
                        aria-label={`Delete message from ${m.name}`}
                        onClick={() => deleteMutation.mutate(m.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <MessageDialog
        message={selectedMessage}
        onClose={() => setSelectedMessage(null)}
        onStatusChange={handleStatusChange}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
    </div>
  );
}
