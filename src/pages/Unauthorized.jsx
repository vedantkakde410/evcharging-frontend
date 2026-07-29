import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Reached when a logged-in user's role doesn't permit the page they tried
// to visit (ProtectedRoute's role mismatch) or an API call came back 403
// (AuthContext's auth:forbidden handler) - distinct from NotFound (which
// means the route itself doesn't exist) and from the /login redirect (which
// means there's no valid session at all).
export default function Unauthorized() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader className="items-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="text-destructive" size={28} />
          </div>
          <CardTitle className="mt-4 text-2xl">Access denied</CardTitle>
          <CardDescription>
            Your account doesn't have permission to view this page.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Button render={<Link to="/" />} className="w-full">
            Back to home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
