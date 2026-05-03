'use client'

import OwnerHeader from "./ui/OwnerHeader";
import StatsCard from "./ui/StatsCard";

export default function OwnerDashboard() {
  return(
    <section className=" min-h-screen">
      <OwnerHeader title="DASHBOARD"/>
      <StatsCard />

    </section>
  );
}