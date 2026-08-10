import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import React from "react";

export const PrimaryButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Button>
>(({ className, ...props }, ref) => {
  return (
    <Button
      className={cn("btn-primary", className)}
      ref={ref}
      {...props}
    />
  );
});
PrimaryButton.displayName = "PrimaryButton";

export const SecondaryButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Button>
>(({ className, ...props }, ref) => {
  return (
    <Button
      className={cn("btn-secondary", className)}
      ref={ref}
      {...props}
    />
  );
});
SecondaryButton.displayName = "SecondaryButton";

export const OutlineButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Button>
>(({ className, ...props }, ref) => {
  return (
    <Button
      variant="outline"
      className={cn("btn-outline", className)}
      ref={ref}
      {...props}
    />
  );
});
OutlineButton.displayName = "OutlineButton";

export const ThemedCard = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Card>
>(({ className, ...props }, ref) => {
  return (
    <Card
      className={cn("card-themed backdrop-blur-xl", className)}
      ref={ref}
      {...props}
    />
  );
});
ThemedCard.displayName = "ThemedCard";

export const ThemedInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<typeof Input>
>(({ className, ...props }, ref) => {
  return (
    <Input
      className={cn("input-themed", className)}
      ref={ref}
      {...props}
    />
  );
});
ThemedInput.displayName = "ThemedInput";

export const ThemedPageWrapper: React.FC<{
  children: React.ReactNode;
  className?: string;
  pageType?: 'default' | 'theater' | 'shop' | 'activities' | 'information';
}> = ({ children, className, pageType = 'default' }) => {
  const bgClasses = {
    default: "bg-background text-foreground",
    theater: "bg-gradient-to-br from-black to-amber-950",
    shop: "text-white",
    activities: "bg-gradient-to-br from-black to-green-950",
    information: "text-white"
  };

  return (
    <div className={cn(
      "min-h-screen w-full",
      bgClasses[pageType],
      className
    )}>
      {children}
    </div>
  );
};
