import BaseButton from "@/components/Ui/BaseButton"
import { ArrowRight, ChevronsDown, Mouse } from "lucide-react"
import Image from "next/image"
import "./HomeHero.css"

export default function HomeHero() {
    return (
        <section
            aria-labelledby="home-hero-title"
            className="home-hero grid w-full border-b border-primary-40 text-primary
                       lg:grid-cols-[minmax(0,16fr)_minmax(0,9fr)]"
        >
            <div className="flex min-w-0 flex-col justify-center px-5 pt-8 pb-6 md:px-9
                            lg:col-start-2 lg:row-start-1 lg:justify-start
                            lg:px-[clamp(1.25rem,2.2vw,4rem)] lg:pt-[clamp(1rem,1.6vw,2rem)] lg:pb-[clamp(1.125rem,2vw,2.5rem)]">
                <p className="font-bold text-accent lg:text-[clamp(1.05rem,1.35vw,1.5rem)]">
                    APSco Manufacturing
                </p>

                <h1
                    id="home-hero-title"
                    className="mt-2.5 text-[clamp(1.9rem,5.9vw,3.5rem)] leading-[1.03]
                               font-extrabold tracking-[-.025em]
                               lg:text-[clamp(2.25rem,4.28vw,4.95rem)]"
                >
                    <span className="block">Think ahead.</span>
                    <span className="block">Build tomorrow.</span>
                </h1>

                <span aria-hidden="true" className="mt-3 h-1.5 w-14 bg-accent lg:mt-[1.2vw] lg:w-[5.5vw]" />

                <p className="mt-2.5 text-base leading-tight
                              lg:mt-[1vw] lg:text-[clamp(1.125rem,1.55vw,1.55rem)]">
                    <span className="block">Products for life, learning and work.</span>
                    <span className="block">Manufactured and sold by APSco.</span>
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-bold
                                lg:mt-[clamp(1rem,1.45vw,1.875rem)] lg:gap-x-[clamp(2rem,4.3vw,5.125rem)]
                                lg:text-[clamp(.9rem,1.15vw,1.25rem)]">
                    <BaseButton
                        title="About APSco"
                        className="bg-transparent text-primary underline underline-offset-6"
                        disabled
                    />
                    <BaseButton
                        title="Explore products"
                        className="inline-flex items-center gap-2 bg-accent px-4 py-2
                                   text-b lg:px-[clamp(1rem,1.5vw,1.75rem)] lg:py-[clamp(.5rem,.65vw,.875rem)]"
                        icon={<ArrowRight aria-hidden="true" className="size-[1em] rtl:rotate-180" />}
                        disabled
                    />
                </div>
            </div>

            <figure className="flex min-w-0 flex-col lg:col-start-1 lg:row-start-1">
                <div className="relative z-10 flex flex-1 items-end justify-center
                                pt-[clamp(2rem,4.55vw,5.5rem)]">
                    <span
                        aria-hidden="true"
                        className="home-hero-create pointer-events-none absolute start-[5.5%] top-1
                                   text-[clamp(3.65rem,16vw,8rem)] leading-none font-extrabold
                                   tracking-[-.01em] whitespace-nowrap select-none
                                   lg:text-[clamp(6rem,11.45vw,15rem)]"
                    >
                        CREATE
                    </span>

                    <Image
                        src="/images/home-hero-products.webp"
                        alt="A patient monitor, a stainless-steel espresso machine and a wooden construction crane toy"
                        width={1785}
                        height={735}
                        sizes="(min-width: 64rem) 49vw, 83vw"
                        loading="eager"
                        fetchPriority="high"
                        className="home-hero-products relative -mb-[clamp(.28rem,.6vw,.75rem)]
                                   block h-auto w-[83%] lg:w-[76%]"
                    />
                </div>

                <figcaption className="home-hero-podium relative isolate flex
                                       min-h-[clamp(3.5rem,5.9vw,6.75rem)] items-center gap-[clamp(1rem,2.05vw,2.5rem)]
                                       px-[7.5%] pt-2.5 text-base font-bold
                                       md:text-lg lg:text-[clamp(1rem,1.55vw,1.6rem)]">
                    <div aria-hidden="true" className="home-hero-podium-shapes">
                        <div className="home-hero-podium-base" />
                        <div className="home-hero-podium-step" />
                    </div>

                    <span aria-hidden="true" className="flex shrink-0 flex-col items-center">
                        <Mouse className="size-[1.2em]" strokeWidth={1.5} />
                        <ChevronsDown className="-mt-0.5 size-[.9em]" strokeWidth={1.5} />
                    </span>

                    <span>
                        Design <span className="text-accent">/</span> Make <span className="text-accent">/</span> Sell
                    </span>
                </figcaption>
            </figure>
        </section>
    )
}
