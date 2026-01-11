"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { X, MapPin, Upload, Tag as TagIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";

// Form validation schema
const postFormSchema = z.object({
  content: z.string().min(1, "Content is required").max(5000, "Content must be less than 5000 characters"),
  images: z.array(z.object({
    storageId: z.string(),
    alt: z.string().min(1, "Alt text is required"),
    previewUrl: z.string().optional(), // for display only
  })).max(10, "Maximum 10 images allowed"),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  tags: z.array(z.string().min(1)).min(1, "At least one tag is required").max(10, "Maximum 10 tags allowed"),
});

type PostFormData = z.infer<typeof postFormSchema>;

export default function NewPostPage() {
  const router = useRouter();
  const createPost = useMutation(api.functions.posts.createPost);
  const generateUploadUrl = useMutation(api.functions.posts.generateUploadUrl);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTag, setCurrentTag] = useState("");
  const [currentImageAlt, setCurrentImageAlt] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PostFormData>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      content: "",
      images: [],
      location: { latitude: 0, longitude: 0 },
      tags: [],
    },
  });

  const images = watch("images");
  const tags = watch("tags");
  const location = watch("location");

  // Get user's current location
  const getUserLocation = useCallback(() => {
    setLocationLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setValue("location", coords);
          setLocationLoading(false);
          toast.success("Location detected");
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Failed to get location. Please enter manually.");
          setLocationLoading(false);
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
      setLocationLoading(false);
    }
  }, [setValue]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    if (!currentImageAlt.trim()) {
      toast.error("Please provide alt text for the image");
      return;
    }

    if (images.length >= 10) {
      toast.error("Maximum 10 images allowed");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    setUploadingImage(true);
    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl();
      
      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Failed to upload image");
      }

      const { storageId } = await result.json();
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);

      // Add to images array
      setValue("images", [
        ...images,
        {
          storageId,
          alt: currentImageAlt.trim(),
          previewUrl,
        },
      ]);

      setCurrentImageAlt("");
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  }, [currentImageAlt, images, generateUploadUrl, setValue]);

  // Remove image from the list
  const removeImage = useCallback((index: number) => {
    const imageToRemove = images[index];
    // Revoke preview URL to free memory
    if (imageToRemove.previewUrl) {
      URL.revokeObjectURL(imageToRemove.previewUrl);
    }
    setValue("images", images.filter((_, i) => i !== index));
    toast.success("Image removed");
  }, [images, setValue]);

  // Add tag to the list
  const addTag = useCallback(() => {
    const trimmedTag = currentTag.trim();
    if (trimmedTag) {
      if (tags.includes(trimmedTag)) {
        toast.error("Tag already exists");
        return;
      }
      if (tags.length >= 10) {
        toast.error("Maximum 10 tags allowed");
        return;
      }
      setValue("tags", [...tags, trimmedTag]);
      setCurrentTag("");
      toast.success("Tag added");
    }
  }, [currentTag, tags, setValue]);

  // Remove tag from the list
  const removeTag = useCallback((index: number) => {
    setValue("tags", tags.filter((_, i) => i !== index));
    toast.success("Tag removed");
  }, [tags, setValue]);

  // Handle form submission
  const onSubmit = async (data: PostFormData) => {
    setIsSubmitting(true);
    try {
      // Remove previewUrl from images before submitting and cast storageId to Id type
      const cleanedImages = data.images.map(({ storageId, alt }) => ({
        storageId: storageId as Id<"_storage">,
        alt,
      }));

      await createPost({
        content: data.content,
        images: cleanedImages,
        location: data.location,
        tags: data.tags,
      });

      // Clean up preview URLs
      images.forEach((img) => {
        if (img.previewUrl) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });

      toast.success("Post created successfully!");
      reset();
      router.push("/");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Create New Post</h1>
          <p className="text-muted-foreground">Share your experience with the community</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Content Section */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <CardDescription>Write your post content (Markdown supported)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <textarea
                  {...register("content")}
                  placeholder="Share your thoughts..."
                  className="w-full min-h-[200px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                />
                {errors.content && (
                  <p className="text-sm text-destructive">{errors.content.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Images Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="size-5" />
                Images
              </CardTitle>
              <CardDescription>Upload images to your post (up to 10, max 10MB each)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="imageAlt">Image Alt Text</Label>
                  <Input
                    id="imageAlt"
                    type="text"
                    placeholder="Describe the image"
                    value={currentImageAlt}
                    onChange={(e) => setCurrentImageAlt(e.target.value)}
                    disabled={uploadingImage}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imageFile">Choose Image File</Label>
                  <div className="flex gap-2">
                    <Input
                      id="imageFile"
                      type="file"
                      accept="image/*"
                      disabled={uploadingImage || images.length >= 10}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file);
                          e.target.value = ""; // Reset input
                        }
                      }}
                      className="flex-1"
                    />
                  </div>
                </div>
                {uploadingImage && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Uploading image...
                  </div>
                )}
              </div>

              {images.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded Images ({images.length}/10)</Label>
                  <div className="space-y-2">
                    {images.map((image, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-md border bg-muted/50"
                      >
                        {image.previewUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={image.previewUrl}
                            alt={image.alt}
                            className="size-16 rounded object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{image.alt}</p>
                          <p className="text-xs text-muted-foreground">
                            Storage ID: {image.storageId.slice(0, 20)}...
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeImage(index)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {errors.images && (
                <p className="text-sm text-destructive">{errors.images.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Location Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="size-5" />
                Location
              </CardTitle>
              <CardDescription>Add location to your post</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                type="button"
                variant="outline"
                onClick={getUserLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Getting location...
                  </>
                ) : (
                  <>
                    <MapPin className="size-4" />
                    Use Current Location
                  </>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="40.7128"
                    {...register("location.latitude", { valueAsNumber: true })}
                  />
                  {errors.location?.latitude && (
                    <p className="text-sm text-destructive">{errors.location.latitude.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="-74.0060"
                    {...register("location.longitude", { valueAsNumber: true })}
                  />
                  {errors.location?.longitude && (
                    <p className="text-sm text-destructive">{errors.location.longitude.message}</p>
                  )}
                </div>
              </div>

              {(location.latitude !== 0 || location.longitude !== 0) && (
                <div className="p-3 rounded-md bg-muted/50 text-sm">
                  <p className="font-medium">Current Location:</p>
                  <p className="text-muted-foreground">
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </p>
                </div>
              )}
              {errors.location && !errors.location.latitude && !errors.location.longitude && (
                <p className="text-sm text-destructive">{errors.location.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Tags Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TagIcon className="size-5" />
                Tags
              </CardTitle>
              <CardDescription>Add tags to categorize your post (1-10 tags)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter a tag"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                  disabled={tags.length >= 10}
                >
                  Add
                </Button>
              </div>

              {tags.length > 0 && (
                <div className="space-y-2">
                  <Label>Tags ({tags.length}/10)</Label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {errors.tags && (
                <p className="text-sm text-destructive">{errors.tags.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || uploadingImage}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Post"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
