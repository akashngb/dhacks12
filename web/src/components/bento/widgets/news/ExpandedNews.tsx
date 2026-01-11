import NewsWidget from "@/components/bento/widgets/news/news";

export default function ExpandedNews() {
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold">Toronto News</h2>
      <NewsWidget />
    </div>
  );
}
