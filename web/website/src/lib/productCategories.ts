export type HomeProductCategory = {
    number: string,
    title: string,
    image: string,
    imageAlt: string,
    imageHeight: string,
}

export const homeProductCategories: HomeProductCategory[] = [
    {
        number: "01",
        title: "Medical products",
        image: "/images/home-category-medical.webp",
        imageAlt: "A patient monitor displaying a green waveform",
        imageHeight: "h-[86%]",
    },
    {
        number: "02",
        title: "Espresso machines",
        image: "/images/home-category-espresso.webp",
        imageAlt: "A brushed stainless-steel espresso machine",
        imageHeight: "h-full",
    },
    {
        number: "03",
        title: "Learning kits",
        image: "/images/home-category-learning.webp",
        imageAlt: "A learning kit with perforated wooden pieces and a storage case",
        imageHeight: "h-[82%]",
    },
    {
        number: "04",
        title: "Toys",
        image: "/images/home-category-toys.webp",
        imageAlt: "A wooden construction crane toy with green blocks",
        imageHeight: "h-[91%]",
    },
    {
        number: "05",
        title: "Home essentials",
        image: "/images/home-category-home.webp",
        imageAlt: "Ceramic vases with a leafy branch",
        imageHeight: "h-[93%]",
    },
    {
        number: "06",
        title: "Office equipment",
        image: "/images/home-category-office.webp",
        imageAlt: "A desk lamp beside notebooks and a pencil cup",
        imageHeight: "h-[96%]",
    },
]
