import BaseButton from "@/components/Ui/BaseButton"
import { ArrowRight } from "lucide-react"
import Image from "next/image"
import type { HomeProductCategory } from "../homeProductCategories"

type HomeProductCardProps = {
    category: HomeProductCategory,
}

export default function HomeProductCard({ category }: HomeProductCardProps) {
    return (
        <li dir="auto" className="min-w-0">
            <div className="relative isolate flex aspect-[2.18/1] items-end justify-center">
                <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-1 -z-10 h-[32%]
                               bg-[radial-gradient(ellipse_at_50%_72%,#75909952_0%,#4f697333_33%,transparent_72%)]"
                />
                <div className={`relative w-[94%] ${category.imageHeight}`}>
                    <Image
                        src={category.image}
                        alt={category.imageAlt}
                        fill
                        sizes="(min-width: 48rem) 25vw, (min-width: 30rem) 45vw, 85vw"
                        className="object-contain object-bottom"
                    />
                </div>
            </div>

            <BaseButton
                title={category.title}
                className="flex min-h-[clamp(1.75rem,2.5vw,2.8rem)] w-full items-center
                           justify-end gap-x-2 px-1 text-end text-sm leading-tight font-bold
                           lg:gap-x-[1vw] lg:text-[clamp(.875rem,1.42vw,1.5rem)]"
                icon={
                    <>
                        <ArrowRight
                            aria-hidden="true"
                            className="order-first me-auto size-[1.2em] shrink-0 rtl:rotate-180"
                        />
                        <span
                            aria-hidden="true"
                            className="shrink-0 rounded-sm bg-accent px-[.55em] py-[.22em]
                                       text-[.8em] leading-tight font-extrabold text-b"
                        >
                            {category.number}
                        </span>
                    </>
                }
                disabled
            />
        </li>
    )
}
