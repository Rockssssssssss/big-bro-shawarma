import Link from "next/link";
import { SafeImage } from "@/components/safe-image";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { PopularProducts } from "@/components/website/popular-products";
import { restaurant, reviews } from "@/lib/data";

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo showText size="sm" />
        <nav className="hidden items-center gap-8 text-sm font-medium text-secondary md:flex">
          <a href="#menu" className="hover:text-primary">
            Menu
          </a>
          <a href="#about" className="hover:text-primary">
            About
          </a>
          <a href="#offers" className="hover:text-primary">
            Offers
          </a>
          <a href="#reviews" className="hover:text-primary">
            Reviews
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/admin/login" className="hidden text-xs text-muted sm:inline">
            Admin
          </Link>
          <Link href="/rider/login" className="hidden text-xs text-muted sm:inline">
            Rider
          </Link>
          <Link href="/app/welcome">
            <Button size="sm">Order Now</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-bg">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <SafeImage
            src="/food/SHH.PNG"
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/85 to-secondary/40" />
        </div>
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-28">
          <div className="animate-fade-up">
            <p className="text-sm font-semibold tracking-[0.18em] text-primary">
              BIG BRO SHAWARMA · Techiman
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white md:text-5xl">
              Fresh Shawarma
              <br />
              Delivered Fast
            </h1>
            <p className="mt-4 max-w-md text-base text-white/75">
              Flame-grilled wraps, family boxes, and ice-cold drinks — ordered
              in under a minute, hot at your door in {restaurant.deliveryEta}.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/app/home">
                <Button size="lg">Order Now</Button>
              </Link>
              <a href="#menu">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                >
                  View Menu
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" id="menu">
        <h2 className="text-2xl font-bold text-secondary md:text-3xl">
          Categories
        </h2>
        <p className="mt-2 text-muted">Pick your craving and dig in.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Shawarma",
              desc: "Chicken, beef & mixed wraps grilled to order.",
              img: "/food/BnC.JPG",
              href: "/app/home",
            },
            {
              title: "Packages",
              desc: "Combos & family boxes for sharing.",
              img: "/food/PI1.JPG",
              href: "/app/home",
            },
            {
              title: "Drinks",
              desc: "Ice-cold sodas & refreshers.",
              img: "/food/drinks.png",
              href: "/app/home",
            },
          ].map((cat) => (
            <Link
              key={cat.title}
              href={cat.href}
              className="group relative h-56 overflow-hidden rounded-[24px] shadow-card"
            >
              <SafeImage
                src={cat.img}
                alt={cat.title}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/90 via-secondary/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="text-xl font-bold text-white">{cat.title}</h3>
                <p className="mt-1 text-sm text-white/75">{cat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular */}
      <PopularProducts />

      {/* About */}
      <section id="about" className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center">
        <div className="relative aspect-square overflow-hidden rounded-[28px] shadow-card md:aspect-[4/5]">
          <SafeImage
            src="/food/bbflyer.PNG"
            alt="About Big Bro"
            fill
            className="object-cover"
          />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-widest text-primary">
            ABOUT US
          </p>
          <h2 className="mt-2 text-3xl font-bold text-secondary">
            Big Bro Shawarma
          </h2>
          <p className="mt-4 leading-relaxed text-muted">
            We&apos;re a fast-growing shawarma kitchen serving Techiman with
            flame-grilled wraps, generous portions, and delivery you can trust.
            From solo lunch combos to family boxes — Big Bro keeps it hot,
            fresh, and simple.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-secondary">
            <li>📍 {restaurant.address}</li>
            <li>🕒 {restaurant.hours}</li>
            <li>📞 {restaurant.phones.join(" · ")}</li>
          </ul>
        </div>
      </section>

      {/* Offers */}
      <section id="offers" className="bg-secondary py-16 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold md:text-3xl">Special Offers</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="flex overflow-hidden rounded-[24px] bg-white/10">
              <div className="flex flex-1 flex-col justify-center p-6">
                <p className="text-xs font-bold tracking-widest text-primary">
                  TODAY&apos;S SPECIAL
                </p>
                <h3 className="mt-2 text-2xl font-bold">Solo Combo GH₵55</h3>
                <p className="mt-2 text-sm text-white/70">
                  Shawarma + fries + drink. Perfect lunch.
                </p>
                <Link href="/app/product/solo-combo" className="mt-4 w-fit">
                  <Button size="sm">Order now</Button>
                </Link>
              </div>
              <div className="relative w-2/5">
                <SafeImage
                  src="/food/CnS2.JPG"
                  alt="Solo Combo"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="flex overflow-hidden rounded-[24px] bg-white/10">
              <div className="flex flex-1 flex-col justify-center p-6">
                <p className="text-xs font-bold tracking-widest text-primary">
                  FAMILY FAVOURITE
                </p>
                <h3 className="mt-2 text-2xl font-bold">Family Box</h3>
                <p className="mt-2 text-sm text-white/70">
                  Feed the squad with the Family Box — packed with flavour.
                </p>
                <Link href="/app/product/family-box" className="mt-4 w-fit">
                  <Button size="sm">Get Family Box</Button>
                </Link>
              </div>
              <div className="relative w-2/5">
                <SafeImage
                  src="/food/free.jpg"
                  alt="Family Box"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold text-secondary md:text-3xl">
          Customer Reviews
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {reviews.slice(0, 3).map((r) => (
            <article
              key={r.id}
              className="rounded-[20px] bg-white p-5 shadow-card"
            >
              <StarRating value={r.rating} size="sm" />
              <p className="mt-3 text-sm leading-relaxed text-secondary">
                &ldquo;{r.comment}&rdquo;
              </p>
              <p className="mt-4 text-sm font-semibold text-secondary">
                {r.name}
              </p>
              <p className="text-xs text-muted">{r.product}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="rounded-[28px] bg-primary px-8 py-12 text-center text-white shadow-float">
          <h2 className="text-3xl font-extrabold">Hungry? Order in under a minute.</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/85">
            Open the Big Bro app experience, pick your wrap, and we&apos;ll handle
            the rest.
          </p>
          <Link href="/app/welcome" className="mt-6 inline-block">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-primary hover:bg-primary-light"
            >
              Start Ordering
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo showText size="sm" />
          <p className="text-sm text-muted">
            © {new Date().getFullYear()} Big Bro Shawarma. Techiman, Ghana.
          </p>
          <div className="flex gap-4 text-sm text-muted">
            <Link href="/admin/login" className="hover:text-primary">
              Admin
            </Link>
            <Link href="/rider/login" className="hover:text-primary">
              Rider
            </Link>
            <Link href="/app" className="hover:text-primary">
              App
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
