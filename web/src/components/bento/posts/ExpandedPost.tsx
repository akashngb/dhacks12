import Post from "./post";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
const posts = [
  {
    author: "Jane Doe",
    date: new Date("2024-01-15T10:30:00"),
    content:
      "Just witnessed a car accident on Main Street. Police and ambulance are on the scene. Traffic is backed up for about 2 blocks.",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800",
  },
  {
    author: "John Smith",
    date: new Date("2024-01-14T15:45:00"),
    content:
      "Neighborhood meeting this weekend about the new community safety program. Everyone welcome!",
    image: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800",
  },
  {
    author: "Maria Garcia",
    date: new Date("2024-01-14T09:20:00"),
    content:
      "Found a lost dog near the park. Please contact if you know the owner. Brown lab mix, very friendly.",
    image: "https://images.unsplash.com/photo-1534361960057-19889db2b76f?w=800",
  },
  {
    author: "David Chen",
    date: new Date("2024-01-13T18:00:00"),
    content:
      "Power outage in the downtown area. Toronto Hydro is working on it. Estimated restoration time: 2 hours.",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
  },
  {
    author: "Sarah Johnson",
    date: new Date("2024-01-13T12:15:00"),
    content:
      "Community garden cleanup day this Saturday. We need volunteers! Bring your own tools if possible.",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800",
  },
];

export default function ExpandedPost() {
  return (
    <div className="flex flex-col gap-4 h-full">
      <Button className="w-fit">
        <PlusIcon className="size-4" />
        Create Post
      </Button>
      <ScrollArea className="h-[calc(80vh-8rem)] w-full">
        <div className="grid grid-cols-3 gap-4 pr-4">
          {posts.map((post, index) => (
            <div key={index}>
              <Post
                author={post.author}
                date={post.date}
                content={post.content}
                image={post.image}
              />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
