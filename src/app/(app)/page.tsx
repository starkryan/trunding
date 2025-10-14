import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthButtons } from "@/components/auth-buttons";

export default async function HomePage() {
  // Better-auth server-side session check (following official docs)
  const session = await auth.api.getSession({
    headers: await headers()
  });

  // If user is authenticated, redirect to home
  if (session) {
    redirect("/home");
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 safe-top safe-bottom">
      {/* Main Content */}
      <div className="container max-w-md mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-12">
          <div className="w-20 h-20 mx-auto bg-gradient-to-r from-primary to-primary/70 rounded-2xl flex items-center justify-center shadow-lg">
            <Zap className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Mintward
          </h1>
          
          <p className="text-lg text-muted-foreground leading-relaxed">
            Experience the future of mobile-first web applications with seamless authentication and beautiful design.
          </p>
        </div>

        {/* App Preview Cards */}
        <div className="space-y-4 mb-12">
          <div className="flex space-x-4 overflow-x-auto pb-4 -mx-2 px-2">
            {[
              { title: "Dashboard", color: "from-blue-500 to-blue-600" },
              { title: "Profile", color: "from-green-500 to-green-600" },
              { title: "Settings", color: "from-purple-500 to-purple-600" },
            ].map((app, index) => (
              <div key={index} className="flex-shrink-0 w-32">
                <div className={cn(
                  "h-40 rounded-2xl bg-gradient-to-br p-4 flex flex-col justify-end",
                  app.color
                )}>
                  <span className="text-white font-medium text-sm">{app.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <AuthButtons />
      </div>
    </div>
  );
}
