import Image from "next/image"
import HomeAboutHighlights from "./HomeAboutHighlights"

export default function HomeAboutSection() {
    return (
        <section
            id="about-apsco"
            aria-labelledby="home-about-title"
            className="border-b border-primary-40 bg-primary-20 px-5 py-6 text-primary
                       md:px-[4.25%] lg:pt-[clamp(.75rem,1.25vw,1.5rem)]
                       lg:pb-[clamp(.875rem,1.4vw,1.75rem)]"
        >
            <div className="grid items-start gap-y-5
                            lg:grid-cols-[minmax(0,61fr)_minmax(0,28fr)] lg:gap-x-[10.75%]">
                <div className="lg:col-start-2 lg:row-start-1">
                    <p className="text-sm leading-tight font-bold lg:text-end lg:text-[clamp(.85rem,1.3vw,1.35rem)]">
                        01 / About us
                    </p>
                    <h2
                        id="home-about-title"
                        className="mt-2 text-[clamp(2rem,5.4vw,2.75rem)] leading-none
                                   font-extrabold tracking-tight lg:mt-[.55vw]
                                   lg:text-[clamp(2.15rem,3.6vw,4.1rem)]"
                    >
                        <span className="block">Six areas.</span>
                        <span className="block">One vision.</span>
                    </h2>
                    <p className="mt-3 text-base leading-[1.22] lg:mt-[.9vw]
                                  lg:text-[clamp(.875rem,1.45vw,1.55rem)]">
                        At APSco, ideas become products for the varied needs of everyday life and business.
                    </p>
                </div>

                <Image
                    src="/images/home-about-assembly.webp"
                    alt="Hands adjusting a metal assembly with a precision screwdriver"
                    width={1920}
                    height={640}
                    sizes="(min-width: 64rem) 56vw, 92vw"
                    className="aspect-video w-full object-cover object-[58%_center] md:aspect-[3/1]
                               lg:col-start-1 lg:row-start-1 lg:aspect-[3.75/1]"
                />
            </div>

            <HomeAboutHighlights />
        </section>
    )
}
