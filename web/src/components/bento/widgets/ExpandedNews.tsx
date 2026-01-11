import NewsWidget from "@/components/bento/widgets/news/news";

interface ExpandedNewsProps {
  onClose: () => void;
}

export default function ExpandedNews({ onClose }: ExpandedNewsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold">Technology News</h2>
      <NewsWidget expanded={true} />
    </div>
  );
}
