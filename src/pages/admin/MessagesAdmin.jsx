import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ContactSubmission from '@/entities/ContactSubmission';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Mail, Phone, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const statusColors = { new: 'bg-green-500', read: 'bg-blue-500', replied: 'bg-purple-500', archived: 'bg-gray-400' };

export default function MessagesAdmin() {
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: () => ContactSubmission.list('-created_at'),
    initialData: [],
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => ContactSubmission.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
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

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Messages</h1>

      {messages.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No messages yet.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {messages.map(m => (
            <Card key={m.id} className={m.status === 'new' ? 'border-green-300 bg-green-50/30' : ''}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{m.name}</h3>
                      <Badge className={`${statusColors[m.status]} text-white text-xs`}>{m.status}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {m.email}</span>
                      {m.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {m.phone}</span>}
                      {m.event_type && <span>Event: {m.event_type}</span>}
                      {m.event_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {m.event_date}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={m.status} onValueChange={v => updateMutation.mutate({ id: m.id, data: { status: v } })}>
                      <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="read">Read</SelectItem>
                        <SelectItem value="replied">Replied</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate(m.id)}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm bg-muted/50 p-4 rounded-xl">{m.message}</p>
                <p className="text-xs text-muted-foreground mt-2">{m.created_at ? format(new Date(m.created_at), 'PPP p') : ''}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}