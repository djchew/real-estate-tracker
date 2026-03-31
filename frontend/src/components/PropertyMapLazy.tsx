"use client";

import dynamic from "next/dynamic";
import { Property } from "@/lib/api";

const PropertyMap = dynamic(() => import("./PropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[280px] rounded-xl bg-stone-100 animate-pulse" />
  ),
});

export default function PropertyMapLazy({ properties, height }: { properties: Property[]; height?: number }) {
  return <PropertyMap properties={properties} height={height} />;
}
