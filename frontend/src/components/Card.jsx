import { clsx } from "clsx";
import React from "react";

const Card = ({ children, className = "", ...props }) => {
  return (
    <div className={clsx("card", className)} {...props}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = "" }) => {
  return <div className={clsx("card-header", className)}>{children}</div>;
};

const CardTitle = ({ children, className = "" }) => {
  return <h3 className={clsx("card-title", className)}>{children}</h3>;
};

const CardDescription = ({ children, className = "" }) => {
  return <p className={clsx("card-description", className)}>{children}</p>;
};

const CardContent = ({ children, className = "" }) => {
  return <div className={clsx("card-content", className)}>{children}</div>;
};

const CardFooter = ({ children, className = "" }) => {
  return <div className={clsx("card-footer", className)}>{children}</div>;
};

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
