import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
interface ExpandedEmptyProps {
  title?: string;
}

export default function ExpandedEMS({ title }: ExpandedEmptyProps) {
  return (
    <div className="w-full h-full relative px-12 flex items-center justify-center">
      <Carousel className="w-full">
        <h1 className="text-center">EMS Services</h1>
        <CarouselContent>
          <CarouselItem>
            <p className="text-center">Police: 911</p>
          </CarouselItem>
          <CarouselItem>
            <p className="text-center">Community: 311</p>
          </CarouselItem>
          <CarouselItem>
            <p className="text-center">NE Police: 711</p>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious className="-left-12" />
        <CarouselNext className="-right-12" />
      </Carousel>
    </div>
  );
}
