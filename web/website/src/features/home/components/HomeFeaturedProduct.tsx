import BaseButton from "@/components/Ui/BaseButton"
import { Plus } from "lucide-react"
import Image from "next/image"

export default function HomeFeaturedProduct() {
    return (
        <section
            id="featured-product"
            aria-labelledby="home-featured-title"
            className="grid gap-y-5 border-b border-primary-40 bg-primary-20 px-5 py-6 text-primary
                       lg:grid-cols-[minmax(0,66fr)_minmax(0,34fr)] lg:gap-x-[4.8%]
                       lg:ps-[1.5%] lg:pe-[2.8%] lg:py-[clamp(.45rem,.75vw,.95rem)]"
        >
            <div className="flex flex-col lg:col-start-2 lg:row-start-1 lg:pb-[.65vw]">
                <p className="text-sm leading-tight font-bold lg:text-end lg:text-[clamp(.85rem,1.3vw,1.4rem)]">
                    03 / A closer look
                </p>
                <h2
                    id="home-featured-title"
                    className="mt-2 text-[clamp(1.75rem,5.15vw,2.5rem)] leading-[1.08]
                               font-extrabold tracking-tight lg:mt-[.75vw]
                               lg:text-[clamp(1.65rem,2.67vw,3.2rem)]"
                >
                    <span className="block">Precision in every detail.</span>
                    <span className="block">A better experience.</span>
                </h2>
                <p className="mt-2.5 text-base leading-tight lg:mt-[.85vw] lg:text-[clamp(.875rem,1.37vw,1.55rem)]">
                    Thoughtful design and attention to detail make everyday use simpler and more enjoyable.
                </p>
                <div className="mt-4 flex lg:mt-auto lg:justify-end lg:pt-2.5">
                    <BaseButton
                        title="View product"
                        className="bg-accent px-5 py-2 text-sm leading-tight font-extrabold text-b
                                   lg:px-[2.15vw] lg:text-[clamp(.9rem,1.35vw,1.5rem)]"
                        disabled
                    />
                </div>
            </div>

            <figure className="relative isolate flex aspect-[1.75/1] min-w-0 items-end overflow-hidden
                               bg-bg md:aspect-[2.8/1] lg:col-start-1 lg:row-start-1 lg:aspect-[3.3/1]">
                <Image
                    src="/images/home-espresso-detail.webp"
                    alt="Close-up of the controls, group head and portafilter on an espresso machine"
                    fill
                    sizes="(min-width: 64rem) 60vw, 100vw"
                    className="-z-10 object-cover object-[61%_center]"
                />
                <figcaption className="w-full bg-linear-to-t from-b/80 to-transparent px-3 pt-5 pb-2.5 lg:px-[1.7vw]">
                    <BaseButton
                        title="Espresso machine / Concept product"
                        className="inline-flex items-center gap-1.5 text-start text-xs font-bold text-primary
                                   lg:text-[clamp(.8rem,1.2vw,1.25rem)]"
                        icon={<Plus aria-hidden="true" className="size-[1.4em] shrink-0 text-accent" strokeWidth={3} />}
                        disabled
                    />
                </figcaption>
            </figure>
        </section>
    )
}
