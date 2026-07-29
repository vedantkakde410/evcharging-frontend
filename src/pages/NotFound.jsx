import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader className="items-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
            <Compass className="text-primary" size={28} />
          </div>
          <CardTitle className="mt-4 text-2xl">Page not found</CardTitle>
          <CardDescription>
            The page you're looking for doesn't exist or may have moved.
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
