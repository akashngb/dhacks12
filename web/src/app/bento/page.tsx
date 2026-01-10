import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export default function BentoPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Bento Grid</h1>
          <p className="text-muted-foreground text-lg">
            A showcase of UI components in a bento-style layout
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 auto-rows-fr">
          {/* Large Card - Stats */}
          <Card className="md:col-span-2 lg:col-span-2 md:row-span-2">
            <CardHeader>
              <CardTitle>Dashboard Stats</CardTitle>
              <CardDescription>Overview of your metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold">12,345</p>
                </div>
                <Badge variant="secondary">+12%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-3xl font-bold">$45,678</p>
                </div>
                <Badge variant="default">+8%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Sessions</p>
                  <p className="text-3xl font-bold">892</p>
                </div>
                <Badge variant="outline">+5%</Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                View Details
              </Button>
            </CardFooter>
          </Card>

          {/* Medium Card - Actions */}
          <Card className="md:col-span-1 lg:col-span-1">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="default">
                Create New
              </Button>
              <Button className="w-full" variant="secondary">
                Import Data
              </Button>
              <Button className="w-full" variant="outline">
                Export Report
              </Button>
            </CardContent>
          </Card>

          {/* Medium Card - Badges */}
          <Card className="md:col-span-1 lg:col-span-1">
            <CardHeader>
              <CardTitle>Status Badges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Active</Badge>
                <Badge variant="secondary">Pending</Badge>
                <Badge variant="outline">Draft</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Small Card - Input */}
          <Card className="md:col-span-1 lg:col-span-1">
            <CardHeader>
              <CardTitle>Search</CardTitle>
            </CardHeader>
            <CardContent>
              <Input placeholder="Type to search..." />
            </CardContent>
          </Card>

          {/* Small Card - Loading */}
          <Card className="md:col-span-1 lg:col-span-1">
            <CardHeader>
              <CardTitle>Loading State</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-8">
              <Spinner className="size-8" />
            </CardContent>
          </Card>

          {/* Medium Card - Buttons Grid */}
          <Card className="md:col-span-2 lg:col-span-2">
            <CardHeader>
              <CardTitle>Button Variants</CardTitle>
              <CardDescription>All available button styles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
            </CardContent>
          </Card>

          {/* Large Card - Feature Showcase */}
          <Card className="md:col-span-2 lg:col-span-2 md:row-span-2">
            <CardHeader>
              <CardTitle>Feature Showcase</CardTitle>
              <CardDescription>
                A comprehensive display of interactive elements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input type="email" placeholder="you@example.com" />
              </div>
              <div className="flex gap-2">
                <Button variant="default">Submit</Button>
                <Button variant="outline">Cancel</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>New</Badge>
                <Badge variant="secondary">Featured</Badge>
                <Badge variant="destructive">Hot</Badge>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Processing your request...
                </p>
                <div className="flex items-center gap-2">
                  <Spinner />
                  <span className="text-sm">Please wait</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Small Card - Info */}
          <Card className="md:col-span-1 lg:col-span-1">
            <CardHeader>
              <CardTitle>Info</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This is a bento-style grid layout showcasing various UI components
                in different card sizes.
              </p>
            </CardContent>
          </Card>

          {/* Small Card - Stats */}
          <Card className="md:col-span-1 lg:col-span-1">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold">1,234</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">8,901</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
