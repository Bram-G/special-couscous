"use client";
import React from "react";
import Carousel2 from "../components/Carousel2";
import Hero from "@/components/Hero/Hero";

export default function Home() {
  return (
    <section className="flex flex-col">
      <div>
        <Hero />
      </div>

      <div className="trendingCarouselContainer flex flex-col w-full">
        <h1 className="">Trending</h1>
        <div>
        <Carousel2 />
        </div>
      </div>
      
    </section>
  );
}
