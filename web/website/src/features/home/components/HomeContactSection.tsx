import BaseButton from "@/components/Ui/BaseButton"
import { ArrowRight, ArrowUpRight } from "lucide-react"

export default function HomeContactSection() {
    return (
        <section
            id="start-a-conversation"
            aria-labelledby="home-contact-title"
            className="grid items-center bg-accent-shades-30 px-5 py-6 text-primary
                       lg:grid-cols-[minmax(0,45.5fr)_minmax(0,54.5fr)] lg:px-[2.9%]
                       lg:py-[clamp(.55rem,.8vw,1.1rem)]"
        >
            <div className="lg:col-start-2 lg:row-start-1">
                <h2
                    id="home-contact-title"
                    className="text-[clamp(1.85rem,5.5vw,2.75rem)] leading-[1.06]
                               font-extrabold tracking-tight lg:text-[clamp(2.1rem,3.57vw,4.15rem)]"
                >
                    Building tomorrow, together.
                </h2>
                <p className="mt-1.5 text-base leading-tight lg:mt-[.4vw] lg:text-[clamp(.875rem,1.4vw,1.55rem)]">
                    For product enquiries and partnerships, connect with APSco.
                </p>
                <div className="mt-3 flex lg:mt-[.55vw] lg:justify-end">
                    <BaseButton
                        title="Start a conversation"
                        className="inline-flex items-center gap-1.5 bg-accent px-4 py-2
                                   text-sm leading-tight font-extrabold text-b
                                   lg:px-[1.55vw] lg:py-[.7vw] lg:text-[clamp(.9rem,1.4vw,1.5rem)]"
                        icon={<ArrowRight aria-hidden="true" className="size-[1.2em] shrink-0 rtl:rotate-180" />}
                        disabled
                    />
                </div>
            </div>

            <ArrowUpRight
                aria-hidden="true"
                viewBox="4 4 16 16"
                strokeLinecap="butt"
                strokeLinejoin="miter"
                strokeWidth={2.45}
                className="hidden size-[clamp(4.25rem,10.15vw,11.4rem)] text-accent
                           lg:col-start-1 lg:row-start-1 lg:block rtl:-scale-x-100"
            />
        </section>
    )
}
