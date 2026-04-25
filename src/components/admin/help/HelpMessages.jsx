import React from 'react';
import { MessageSquare, Clock, Trash2, CheckCircle } from 'lucide-react';

export default function HelpMessages() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Messages</h2>
          <p className="text-sm text-muted-foreground">Every contact form submission from your website</p>
        </div>
      </div>

      <p className="text-muted-foreground leading-relaxed text-sm">
        When someone fills out the contact form on your website, their message lands here. You'll also get an email notification sent to your inbox automatically. This page lets you track and manage all your inquiries in one place.
      </p>

      <div className="space-y-3">
        <h3 className="font-bold text-base">Message Status Colors</h3>
        <p className="text-sm text-muted-foreground">Each message has a colored status badge. Here's what they mean:</p>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
            <span className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm text-green-800">New</p>
              <p className="text-xs text-green-700">A fresh inquiry you haven't looked at yet. These show with a green border to grab your attention. Check these first!</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <span className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm text-blue-800">Read</p>
              <p className="text-xs text-blue-700">You've opened and read this message. Change to this status after you've reviewed it.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-xl">
            <span className="w-3 h-3 rounded-full bg-purple-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm text-purple-800">Replied</p>
              <p className="text-xs text-purple-700">You've responded to this person. Change to this status after you've sent them a reply so you don't forget.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
            <span className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm text-gray-700">Archived</p>
              <p className="text-xs text-gray-600">Done with this message — booking confirmed, declined, or no longer relevant. Archive it to keep your inbox clean.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> How to Change a Message Status</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          On the right side of each message, there's a small dropdown showing the current status. Click it and select the new status. It saves automatically — no need to click a Save button.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base flex items-center gap-2"><Trash2 className="w-4 h-4 text-red-500" /> How to Delete a Message</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Click the trash icon on the right side of the message. It will be permanently deleted — there's no undo, so only delete messages you're sure you don't need anymore. When in doubt, archive instead of delete.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base">What information is in each message?</h3>
        <ul className="text-sm text-muted-foreground space-y-1.5">
          <li>• <strong>Name</strong> — the person's name</li>
          <li>• <strong>Email</strong> — their email address (click to open your email app)</li>
          <li>• <strong>Phone</strong> — their phone number if they provided one</li>
          <li>• <strong>Event Type</strong> — what kind of event they're planning</li>
          <li>• <strong>Event Date</strong> — when their event is</li>
          <li>• <strong>Message</strong> — what they wrote in the form</li>
          <li>• <strong>Received date</strong> — when they submitted the form</li>
        </ul>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
        <p className="font-bold text-orange-800 mb-2 flex items-center gap-2"><Clock className="w-4 h-4" /> Speed matters for bookings</p>
        <p className="text-sm text-orange-700 leading-relaxed">
          Studies show that responding to an inquiry within the first hour makes you <strong>7x more likely to book the client</strong> compared to responding after an hour. Check your messages at least twice a day — morning and evening. You'll also get an email notification every time someone submits the form, so you can respond quickly even when you're not logged in.
        </p>
      </div>
    </div>
  );
}
