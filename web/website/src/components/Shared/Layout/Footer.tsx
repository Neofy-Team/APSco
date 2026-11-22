import Link from "next/link";
import { MessageCircleMore, CircleArrowUp } from 'lucide-react';

export default function Footer() {

    const Columns = [
        {
            id: 1,
            title: "About APSco",
            links: [
                { id: 1, title: "About us", href: "/about-us" },
                { id: 2, title: "What we do", href: "/" },
                { id: 3, title: "Our process", href: "/" },
            ],
        },
        {
            id: 2,
            title: "Products",
            links: [
                { id: 1, title: "Medical products", href: "/" },
                { id: 2, title: "Espresso machine", href: "/" },
                { id: 3, title: "Learning kits", href: "/" },
                { id: 4, title: "More Products", href: "/" },
            ],
        },
    ]

    return (
        <div className="w-full p-5 bg-bg">
            <div className="flex justify-between p-5 border-b-2 border-primary-60">

                <div className="flex flex-col justify-center flex-1 pe-5 border-e-2 border-primary-60">

                    <div className="flex items-center gap-x-2">
                        <h1 className="font-extrabold text-d2xl">APSco</h1>
                        <span className="w-6 h-6 rounded-[.2rem] bg-accent-shades-10" />
                    </div>

                    <p>Think ahead. Build tomorrow</p>
                </div>

                {Columns.map(column => (
                    <div
                        key={column.id}
                        className="flex justify-center flex-1 px-5 border-e-2 border-primary-60"
                    >
                        <div className="flex flex-col gap-y-1">
                            <h3 className="font-bold">{column.title}</h3>

                            <div className="flex flex-col">
                                {column.links.map(link => (
                                    <Link href={link.href} key={link.id}>{link.title}</Link>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}

                <div className="flex justify-center flex-1 ps-5">
                    <div className="flex flex-col">
                        <h3 className="font-bold">Contact</h3>

                        <p className="flex items-center gap-x-2">
                            Talk to the APSco team
                            <MessageCircleMore className="text-accent-shades-10" />
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
                <p className="font-bold"><span className="text-accent-shades-10">EN</span> / FA</p>

                <p>APSco, All rights reserved.</p>

                <CircleArrowUp className="text-accent-shades-10 size-8" />
            </div>
        </div>
    )
}