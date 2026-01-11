import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type postProps = {
  author: string;
  date: Date;
  content: string;
  image: string;
};

export default function Post(props: postProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{props.author}</CardTitle>
          <CardDescription>{props.date.toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{props.content}</p>
          <img src={props.image} />
        </CardContent>
      </Card>
    </>
  );
}
