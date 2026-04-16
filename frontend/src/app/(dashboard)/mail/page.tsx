"use client";

import { useState, useEffect } from "react";
import { Mail, Send, History, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axios from "axios";
import { serviceUrls } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const mailApiClient = axios.create({
  baseURL: serviceUrls.mail,
  headers: { "Content-Type": "application/json" },
});

interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  status: string;
  sentAt: string;
}

export default function MailPage() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const response = await mailApiClient.get("/api/v1/mail/logs");
      // Pagination structure from Spring Data Page
      setLogs(response.data.content || []); 
    } catch (error) {
      console.error("Failed to fetch mail logs:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !subject || !body) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setSending(true);
      await mailApiClient.post("/api/v1/mail/send", { to, subject, body });
      toast.success("Mail request queued successfully via SQS", {
        description: "The mail-service will process this shortly.",
      });
      setTo("");
      setSubject("");
      setBody("");
      // Refresh logs after a delay to allow SQS consumption
      setTimeout(fetchLogs, 2000);
    } catch (error) {
      console.error("Failed to send mail:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mail Testing</h1>
        <p className="text-muted-foreground">
          Test asynchronous email dispatch via Amazon SQS and SES.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" /> Composer
            </CardTitle>
            <CardDescription>
              Write and send a test email. The message will be queued via SQS.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Recipient Email</label>
                <Input
                  placeholder="recipient@example.com"
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  disabled={sending}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input
                  placeholder="Test Mail from AWS Demo"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={sending}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message Body</label>
                <Textarea
                  placeholder="Hello from the Next.js dashboard!"
                  className="min-h-[120px]"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  disabled={sending}
                />
              </div>
              <Button type="submit" className="w-full" disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Queueing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Send Test Email
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" /> Dispatch Logs
            </CardTitle>
            <CardDescription>
              Historical record of emails sent from this system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingLogs ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-10">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-10">
                        No logs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="max-w-[150px] truncate">
                          {log.recipient}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center w-fit gap-1 bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3" /> Sent
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(log.sentAt).toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <Button
              variant="ghost"
              className="w-full mt-4 text-xs h-8"
              onClick={fetchLogs}
              disabled={loadingLogs}
            >
              Refresh Logs
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
