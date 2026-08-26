import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/Library/Utility";
import { ButtonProperties, buttonVariants } from "@/Component/UI/Button";

const Pagination = ({ className, ...props }: React.ComponentProperties<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
);
Pagination.Display_Name = "Pagination";

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProperties<"ul">>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("flex flex-row items-center gap-1", className)} {...props} />
  ),
);
PaginationContent.Display_Name = "PaginationContent";

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProperties<"li">>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
));
PaginationItem.Display_Name = "PaginationItem";

type PaginationLinkProperties = {
  isActive?: boolean;
} & Pick<ButtonProperties, "size"> &
  React.ComponentProperties<"a">;

const PaginationLink = ({ className, isActive, size = "icon", ...props }: PaginationLinkProperties) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      className,
    )}
    {...props}
  />
);
PaginationLink.Display_Name = "PaginationLink";

const PaginationPrevious = ({ className, ...props }: React.ComponentProperties<typeof PaginationLink>) => (
  <PaginationLink aria-label="Go to previous page" size="default" className={cn("gap-1 pl-2.5", className)} {...props}>
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
);
PaginationPrevious.Display_Name = "PaginationPrevious";

const PaginationNext = ({ className, ...props }: React.ComponentProperties<typeof PaginationLink>) => (
  <PaginationLink aria-label="Go to next page" size="default" className={cn("gap-1 pr-2.5", className)} {...props}>
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
);
PaginationNext.Display_Name = "PaginationNext";

const PaginationEllipsis = ({ className, ...props }: React.ComponentProperties<"span">) => (
  <span aria-hidden className={cn("flex h-9 w-9 items-center justify-center", className)} {...props}>
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
);
PaginationEllipsis.Display_Name = "PaginationEllipsis";

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
