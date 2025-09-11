"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const authSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

export type AuthFormValues = z.infer<typeof authSchema>;

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const { signIn, signUp, sendPasswordReset, resendVerificationEmail } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSignIn = async (data: AuthFormValues) => {
    setIsLoading(true);
    setShowResend(false);
    try {
      await signIn(data);
      router.push("/");
    } catch (error: any) {
      if (error.code === "auth/user-not-verified") {
        setShowResend(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (data: AuthFormValues) => {
    setIsLoading(true);
    try {
      await signUp(data);
      form.reset();
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox and verify your email address to sign in.",
      });
    } catch (error) {
      // Error is handled in useAuth hook
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const email = form.getValues("email");
    if (!email) {
        form.trigger("email");
        return;
    }
    setIsLoading(true);
    await sendPasswordReset(email);
    setIsLoading(false);
  }

  const handleResendVerification = async () => {
    const email = form.getValues("email");
    if (!email) {
        form.trigger("email");
        return;
    }
    setIsLoading(true);
    await resendVerificationEmail(email, form.getValues("password"));
    setIsLoading(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-3xl font-bold text-primary">
                Welcome to LexEase
            </h1>
            <p className="text-muted-foreground">
                Sign in or create an account to continue
            </p>
        </div>
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-background">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <Card className="bg-white shadow-lg border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Sign In</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSignIn)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="name@example.com"
                              {...field}
                              disabled={isLoading}
                              className="text-base"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                              disabled={isLoading}
                              className="text-base"
                            />
                          </FormControl>
                           <div className="text-right">
                                <Button
                                type="button"
                                variant="link"
                                className="h-auto p-0 text-sm text-accent"
                                onClick={handlePasswordReset}
                                disabled={isLoading}
                                >
                                Forgot Password?
                                </Button>
                            </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {showResend && (
                        <div className="flex flex-col items-center space-y-2">
                             <p className="text-sm text-center text-destructive">Your email is not verified.</p>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={handleResendVerification}
                                disabled={isLoading}
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Resend Verification Email
                            </Button>
                        </div>
                    )}
                   
                    <Button type="submit" className="w-full bg-accent text-white font-semibold py-3 rounded-lg hover:bg-accent/90" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
            <Card className="bg-white shadow-lg border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Sign Up</CardTitle>
                <CardDescription>
                  Create a new account to get started.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSignUp)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="name@example.com"
                              {...field}
                              disabled={isLoading}
                              className="text-base"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                              disabled={isLoading}
                              className="text-base"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full bg-accent text-white font-semibold py-3 rounded-lg hover:bg-accent/90" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign Up
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
