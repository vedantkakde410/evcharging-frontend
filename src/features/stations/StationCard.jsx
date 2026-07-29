import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RatingStars from "@/components/shared/RatingStars";

export default function StationCard({ station }) {
  const { id, name, location, rating, totalChargers, availableChargers } = station;
  const isAvailable = availableChargers > 0;

  return (
    <motion.div whileHover={{ y: -8 }}>
      <Card className="gap-0 py-0">
        <div className="h-40 bg-gradient-to-r from-primary to-emerald-700" />

        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-2xl font-bold">{name}</h3>
            <Badge variant={isAvailable ? "default" : "destructive"} className="shrink-0">
              {isAvailable ? "Available" : "Full"}
            </Badge>
          </div>

          <p className="mt-2 flex items-center gap-1 text-muted-foreground">
            <MapPin size={16} />
            {location}
          </p>

          <div className="mt-6 flex items-center justify-between text-sm">
            <RatingStars rating={rating} size={14} />

            <span className="flex items-center gap-1 text-muted-foreground">
              <Zap size={16} />
              {availableChargers}/{totalChargers} chargers
            </span>
          </div>

          <Button className="mt-6 w-full" render={<Link to={`/station/${id}`} />}>
            View Station
            <ArrowRight className="ml-2" size={18} />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
