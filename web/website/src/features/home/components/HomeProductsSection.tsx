import BaseButton from "@/components/Ui/BaseButton"
import { ArrowRight } from "lucide-react"
import { homeProductCategories } from "@/lib/productCategories"
import HomeProductCard from "./HomeProductCard"

export default function HomeProductsSection() {
    return (
        <section
            id="our-products"
            aria-labelledby="home-products-title"
            className="border-b border-primary-40 bg-bg px-5 pt-6 pb-5 text-primary
                       bg-[radial-gradient(ellipse_at_48%_72%,#293c44,#1b2c33_78%)]
                       md:px-[4.25%] lg:pe-[3.2%] lg:pt-[clamp(.65rem,1.05vw,1.35rem)]
                       lg:pb-[clamp(.5rem,.85vw,1.1rem)]"
        >
            <div className="grid gap-y-3 md:grid-cols-[1fr_auto] md:items-start">
                <div className="md:col-start-2 md:row-start-1 md:text-end">
                    <p className="text-sm leading-tight font-bold text-accent lg:text-[clamp(.85rem,1.35vw,1.5rem)]">
                        02 / What we do
                    </p>
                    <h2
                        id="home-products-title"
                        className="mt-0.5 text-[clamp(1.85rem,5.5vw,2.75rem)] leading-none
                                   font-extrabold tracking-tight lg:text-[clamp(1.95rem,3.25vw,3.85rem)]"
                    >
                        Our product world
                    </h2>
                    <p className="mt-0.5 text-sm leading-tight font-bold text-accent lg:text-[clamp(.9rem,1.48vw,1.6rem)]">
                        Made by APSco
                    </p>
                </div>

                <BaseButton
                    title="All products"
                    className="inline-flex w-fit items-center gap-1.5 text-sm font-bold
                               underline underline-offset-6 md:col-start-1 md:row-start-1 md:mt-[.65vw]
                               lg:text-[clamp(.9rem,1.42vw,1.5rem)]"
                    icon={<ArrowRight aria-hidden="true" className="size-[1.15em] rtl:rotate-180" />}
                    disabled
                />
            </div>

            <ul className="mt-3 grid gap-x-5 gap-y-3 min-[480px]:grid-cols-2
                           md:mx-[3.8%] md:-mt-[clamp(.5rem,1.6vw,1.9rem)] md:grid-cols-3
                           md:[direction:rtl] md:gap-x-[clamp(1.5rem,5.8vw,6rem)] md:gap-y-[.65vw]">
                {homeProductCategories.map(category => (
                    <HomeProductCard key={category.number} category={category} />
                ))}
            </ul>
        </section>
    )
}
