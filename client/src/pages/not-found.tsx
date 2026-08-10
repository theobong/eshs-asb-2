import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 flex-shrink-0 text-red-500" />
            <h1 className="text-2xl font-bold text-card-foreground">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            We could not find the page you were looking for.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex min-h-11 items-center rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-medium text-card-foreground hover:bg-white/15"
          >
            Back to home
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
