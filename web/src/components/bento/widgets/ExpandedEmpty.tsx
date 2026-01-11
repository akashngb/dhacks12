interface ExpandedEmptyProps {
  title: string;
}

export default function ExpandedEmpty({ title }: ExpandedEmptyProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold">{title}</h2>
      <p className="text-gray-500">Content coming soon</p>
    </div>
  );
}
