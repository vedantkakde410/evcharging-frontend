import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  BatteryCharging,
  MapPinned,
  Clock3,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { stationApi } from "@/services/stationApi";
import { useFetch } from "@/hooks/useFetch";
import { CardSkeleton } from "@/components/shared/LoadingSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import AsyncSection from "@/components/shared/AsyncSection";
import StationCard from "@/features/stations/StationCard";

const stats = [
  {
    title: "Charging Stations",
    value: "150+",
  },
  {
    title: "Fast Chargers",
    value: "500+",
  },
  {
    title: "Bookings",
    value: "5000+",
  },
  {
    title: "Availability",
    value: "99%",
  },
];

const features = [
  {
    icon: MapPinned,
    title: "Find Nearby Stations",
    desc: "Locate EV charging stations around you in seconds.",
  },
  {
    icon: BatteryCharging,
    title: "Fast Charging",
    desc: "Book ultra-fast DC chargers with live availability.",
  },
  {
    icon: Clock3,
    title: "Instant Booking",
    desc: "Reserve your charger before you reach the station.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    desc: "Safe booking experience with transparent pricing.",
  },
];

export default function Home() {
  const { data: stations, loading, error, refetch } = useFetch(
    stationApi.getStations,
    []
  );

  return (
    <div>
      {/* HERO */}

      <section className="bg-gradient-to-br from-green-600 to-emerald-700 text-white">

        <div className="max-w-7xl mx-auto px-6 py-28">

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl font-black max-w-3xl leading-tight"
          >
            Charge Smarter.
            <br />
            Drive Further.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: .2 }}
            className="text-xl mt-6 max-w-xl text-green-100"
          >
            Find nearby EV charging stations, compare prices,
            reserve your charger and manage bookings with ease.
          </motion.p>

          <div className="flex gap-4 mt-10">

            <Button
              size="lg"
              className="bg-white text-green-700 hover:bg-slate-100"
              render={<Link to="/station/1" />}
            >
              Explore Stations
            </Button>

            <Button size="lg" variant="secondary" render={<Link to="/register" />}>
              Get Started
            </Button>

          </div>

        </div>

      </section>

      {/* STATS */}

      <section className="max-w-7xl mx-auto px-6 py-16">

        <div className="grid md:grid-cols-4 gap-6">

          {stats.map((item) => (

            <motion.div
              whileHover={{ y: -6 }}
              key={item.title}
              className="bg-white rounded-2xl shadow p-8 text-center"
            >

              <h2 className="text-5xl font-bold text-green-600">
                {item.value}
              </h2>

              <p className="mt-3 text-slate-500">
                {item.title}
              </p>

            </motion.div>

          ))}

        </div>

      </section>

      {/* FEATURES */}

      <section className="bg-slate-100 py-20">

        <div className="max-w-7xl mx-auto px-6">

          <h2 className="text-4xl font-bold text-center">
            Why Choose EVCharge?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">

            {features.map((item) => {

              const Icon = item.icon;

              return (

                <motion.div
                  whileHover={{ scale: 1.03 }}
                  key={item.title}
                  className="bg-white rounded-2xl p-8 shadow"
                >

                  <div className="bg-green-100 w-14 h-14 rounded-xl flex items-center justify-center">

                    <Icon
                      className="text-green-600"
                      size={30}
                    />

                  </div>

                  <h3 className="font-bold text-xl mt-6">
                    {item.title}
                  </h3>

                  <p className="text-slate-500 mt-3">
                    {item.desc}
                  </p>

                </motion.div>

              );

            })}

          </div>

        </div>

      </section>

      {/* FEATURED STATIONS */}

      <section className="max-w-7xl mx-auto px-6 py-20">

        <div className="flex justify-between items-center">

          <h2 className="text-4xl font-bold">
            Featured Stations
          </h2>

        </div>

        <AsyncSection
          loading={loading}
          error={error}
          empty={stations?.length === 0}
          onRetry={refetch}
          errorClassName="mt-12"
          errorTitle="Couldn't load stations"
          errorMessage="Please check your connection and try again."
          skeleton={
            <div className="grid lg:grid-cols-3 gap-8 mt-12">
              {Array.from({ length: 3 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          }
          emptyState={
            <EmptyState
              className="mt-12"
              icon={MapPinned}
              title="No stations yet"
              message="Check back soon — new charging stations are added regularly."
            />
          }
        >
          <div className="grid lg:grid-cols-3 gap-8 mt-12">
            {stations?.slice(0, 6).map((station) => (
              <StationCard key={station.id} station={station} />
            ))}
          </div>
        </AsyncSection>

      </section>

      {/* CTA */}

      <section className="bg-green-600 py-24 text-white">

        <div className="max-w-5xl mx-auto text-center px-6">

          <h2 className="text-5xl font-bold">
            Ready to Charge Your Journey?
          </h2>

          <p className="mt-6 text-xl text-green-100">
            Join thousands of EV owners using EVCharge every day.
          </p>

          <Button
            size="lg"
            className="mt-10 bg-white text-green-700 hover:bg-slate-100"
            render={<Link to="/register" />}
          >
            Create Free Account
          </Button>

        </div>

      </section>
    </div>
  );
}