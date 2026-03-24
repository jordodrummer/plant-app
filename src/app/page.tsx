import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFeaturedItems } from "@/lib/db/items";
import PlantPlaceholder from "@/components/plant-placeholder";

export const revalidate = 60;

export default async function Home() {
  const featured = await getFeaturedItems(3);

  return (
    <div className="-mx-4 -mt-8">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1a3a2a] to-[#2d5a3d] px-4 py-16 sm:py-20">
        <div className="container mx-auto grid items-center gap-8 sm:grid-cols-2">
          <div>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              Rare Cactus &amp;<br />Succulent Inventory
            </h1>
            <p className="mt-3 text-white/70">
              Hand-picked rare plants shipped to your door
            </p>
            <Button
              nativeButton={false}
              render={<Link href="/products" />}
              className="mt-6 bg-white text-[#1a3a2a] hover:bg-white/90"
            >
              Shop Now
            </Button>
          </div>
          <div className="flex justify-center">
            <svg
              width="160"
              height="160"
              viewBox="0 0 80 80"
              fill="none"
              aria-hidden="true"
              className="text-white/20"
            >
              <ellipse cx="40" cy="70" rx="20" ry="4" fill="currentColor" />
              <rect x="37" y="30" width="6" height="40" rx="3" fill="currentColor" />
              <ellipse cx="40" cy="24" rx="14" ry="18" fill="currentColor" />
              <ellipse cx="22" cy="40" rx="8" ry="12" fill="currentColor" transform="rotate(-20 22 40)" />
              <ellipse cx="58" cy="40" rx="8" ry="12" fill="currentColor" transform="rotate(20 58 40)" />
            </svg>
          </div>
        </div>
      </section>

      {/* Featured Plants */}
      {featured.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <h2 className="mb-6 text-2xl font-bold">Featured Plants</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((plant) => (
              <Card key={plant.id} className="relative transition-shadow hover:shadow-lg">
                <CardHeader>
                  <CardTitle>
                    <Link href={`/products/${plant.id}`} className="after:absolute after:inset-0">
                      {plant.cultivar_name}
                    </Link>
                  </CardTitle>
                </CardHeader>
                {plant.image ? (
                  <div className="relative aspect-video w-full overflow-hidden">
                    <Image
                      src={plant.image}
                      alt={plant.cultivar_name}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <PlantPlaceholder />
                )}
                <CardContent>
                  <p className="text-muted-foreground mb-2">{plant.details}</p>
                  <span className="font-semibold">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(plant.price)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button
              nativeButton={false}
              render={<Link href="/products" />}
              variant="outline"
            >
              View All Products
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
