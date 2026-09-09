"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-3",
        month_caption: "flex justify-center pt-1 relative items-center text-sm font-medium text-foreground",
        nav: "flex items-center justify-between absolute inset-x-1 top-1",
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "h-6 w-6",
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "h-6 w-6",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-muted-foreground rounded-md w-8 font-normal text-[0.75rem]",
        week: "flex w-full mt-1",
        day: "h-8 w-8 text-center text-sm p-0 relative",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
        ),
        selected: "bg-primary text-primary-foreground rounded-md hover:bg-primary",
        today: "text-primary font-semibold",
        outside: "text-faint-foreground opacity-50",
        disabled: "text-faint-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
