'use client';

import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, CircleCheck as CheckCircle2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { AppLayout } from '@/components/app-layout';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', category: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    setSent(true);
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Contact Us</h1>
          </div>
          <p className="text-sm text-muted-foreground">Get in touch with the Neurive team</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            {sent ? (
              <Card className="border">
                <CardContent className="p-10 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h2 className="text-lg font-semibold mb-2">Message Sent!</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Thank you for contacting us. Our team will respond within 2 business days.
                  </p>
                  <Button variant="outline" onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', category: '', message: '' }); }}>
                    Send Another Message
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border">
                <CardContent className="p-5">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs mb-1.5 block">Full Name *</Label>
                        <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your name" required />
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">Email *</Label>
                        <Input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com" required />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs mb-1.5 block">Topic</Label>
                      <Select value={form.category} onValueChange={(v) => setForm(p => ({ ...p, category: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select a topic" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Inquiry</SelectItem>
                          <SelectItem value="technical">Technical Support</SelectItem>
                          <SelectItem value="archive">Archive Record Request</SelectItem>
                          <SelectItem value="upload">Upload Assistance</SelectItem>
                          <SelectItem value="api">API Access</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="feedback">Feedback</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs mb-1.5 block">Subject *</Label>
                      <Input value={form.subject} onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Brief subject" required />
                    </div>

                    <div>
                      <Label className="text-xs mb-1.5 block">Message *</Label>
                      <Textarea
                        value={form.message}
                        onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))}
                        placeholder="Describe your inquiry in detail..."
                        className="h-32 resize-none text-sm"
                        required
                      />
                    </div>

                    <Button type="submit" disabled={loading} className="gap-2 w-full sm:w-auto">
                      {loading ? 'Sending...' : <><Send className="h-4 w-4" />Send Message</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            {[
              { icon: MapPin, title: 'Address', lines: ['Karnataka State Archives', 'Ambedkar Veedhi', 'Bengaluru - 560 001', 'Karnataka, India'] },
              { icon: Phone, title: 'Phone', lines: ['+91 80 2225 4451', '+91 80 2225 4452', 'Mon-Fri: 9:30 AM - 5:30 PM'] },
              { icon: Mail, title: 'Email', lines: ['info@neurive.karnataka.gov.in', 'archives@ksarchives.gov.in'] },
              { icon: Clock, title: 'Office Hours', lines: ['Monday - Friday', '9:30 AM to 5:30 PM IST', 'Closed on Government Holidays'] },
            ].map(({ icon: Icon, title, lines }) => (
              <Card key={title} className="border">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
                      {lines.map((line, i) => (
                        <p key={i} className="text-xs text-muted-foreground">{line}</p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
