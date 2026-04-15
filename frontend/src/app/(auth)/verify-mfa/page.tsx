"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import apiClient, { serviceUrls } from "@/lib/api/client";

export default function VerifyMfaPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleVerify() {
    if (!code) {
      toast.error("Please enter the verification code");
      return;
    }

    try {
      setIsLoading(true);
      const session = localStorage.getItem("mfa_session") || "";
      const username = localStorage.getItem("mfa_username") || "";

      const response = await apiClient.post(
        `${serviceUrls.auth}/api/v1/auth/verify-mfa`,
        { username, code, session }
      );

      const { access_token, cognito_id_token } = response.data;
      const userObj = { email: username };

      localStorage.setItem("auth_token", access_token);
      localStorage.setItem("cognito_id_token", cognito_id_token || "");
      localStorage.setItem("auth_user", JSON.stringify(userObj));
      localStorage.removeItem("mfa_session");
      localStorage.removeItem("mfa_username");

      toast.success("Verification successful");
      router.push("/home");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight text-center">
          MFA Verification
        </CardTitle>
        <CardDescription className="text-center">
          Enter the code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code">Verification Code</Label>
          <Input
            id="code"
            type="text"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
          />
        </div>
        <Button className="w-full" onClick={handleVerify} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify
        </Button>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => router.push("/login")}
        >
          Back to Login
        </Button>
      </CardFooter>
    </Card>
  );
}
