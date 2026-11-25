import ArticleDetailPage from "@/features/articles/ArticleDetailPage"

export function generateStaticParams() {
    return [{ slug: "sample" }]
}

export default function Article() {
    return <ArticleDetailPage />
}