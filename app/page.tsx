'use client';

import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import Footer from '../components/Footer';
import ShuffleHero from "@/components/Home/ShuffleHero";
import {HeroScrollDemo} from "@/components/Home/HeroScrollDemo";
import HeroSlideshow from "@/components/Home/HeroSlideShow";
import {LayoutGridDemo} from "@/components/Home/LayoutGridDemo";
import {MarqueeDemo} from "@/components/Home/MarqueeDemo";
import WatchAndShop from "@/components/WatchAndShop";
import BestsellerCarousel from "@/components/Home/BestsellerCarousel";

export default function HomePage() {
  const [showCart, setShowCart] = useState(false);

  return (
      <main className="min-h-screen bg-gray-100 ">
        {/*<Navbar show={showCart} setShow={setShowCart} />*/}
          <HeroSlideshow />
          <BestsellerCarousel />
        <ShuffleHero />
          <LayoutGridDemo />
          <MarqueeDemo />
          <WatchAndShop />
          {/*<HeroScrollDemo />*/}

      </main>
  );
}
