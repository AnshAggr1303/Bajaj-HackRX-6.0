"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster"
      position="top-right"
      toastOptions={{
        style: {},
        className: "",
        descriptionClassName: "text-muted-foreground",
        actionButtonStyle: {
          marginLeft: "auto",
        },
        cancelButtonStyle: {
          marginLeft: "auto",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }